import { Bot, Context, session, SessionFlavor, InlineKeyboard } from "grammy";
import { v4 as uuidv4 } from "uuid";
import { LinkRepository } from "@/lib/db";
import { Branch, BranchNames, SessionData } from "@/lib/types";

if (!process.env.BOT_TOKEN) throw new Error("Нет BOT_TOKEN в .env");

const ADMIN_IDS = (process.env.ADMIN_IDS || "").split(",").map(id => parseInt(id.trim()));

type MyContext = Context & SessionFlavor<SessionData>;

export const bot = new Bot<MyContext>(process.env.BOT_TOKEN);

bot.use(session({ 
    initial: (): SessionData => ({ step: "idle", tempLink: {} }) 
}));

// --- Хелперы ---
function isUserAdmin(id?: number): boolean {
    if (!id) return false;
    return ADMIN_IDS.includes(id);
}

const getBranchesKeyboard = (actionPrefix: string) => {
    const kb = new InlineKeyboard();
    let i = 0;
    for (const [key, name] of Object.entries(BranchNames)) {
        kb.text(name, `${actionPrefix}_${key}`);
        if (i % 2 !== 0) kb.row();
        i++;
    }
    return kb;
};

async function showDeleteList(ctx: MyContext) {
    if (!ctx.from) return;
    const links = await LinkRepository.getByAdmin(ctx.from.id);

    if (links.length === 0) {
        const text = "📭 У вас нет активных ссылок.";
        const kb = new InlineKeyboard().text("🔙 В меню", "cancel_action");
        if (ctx.callbackQuery) await ctx.editMessageText(text, { reply_markup: kb });
        else await ctx.reply(text, { reply_markup: kb });
        return;
    }

    const kb = new InlineKeyboard();
    links.forEach(l => {
        kb.text(`🗑 ${l.title} (${l.clicks} 👀)`, `admin_ask_del_${l.id}`).row();
    });
    kb.text("🔙 Назад", "cancel_action");

    await ctx.editMessageText(`📂 **Управление ссылками**\nНажмите для удаления:`, { reply_markup: kb, parse_mode: "Markdown" });
}

// --- Команды ---
bot.command("start", async (ctx) => {
    const userId = ctx.from?.id;
    if (isUserAdmin(userId)) {
        await ctx.reply(`👨‍💻 **Админ панель**`, {
            parse_mode: "Markdown",
            reply_markup: new InlineKeyboard()
                .text("➕ Создать", "admin_add").row()
                .text("🗑 Удалить", "admin_delete_list").row()
                .text("📊 Аналитика", "admin_analytics")
        });
    } else {
        await ctx.reply(`👋 База знаний **Orzu Medical**.\n📂 **Выберите филиал:**`, {
            parse_mode: "Markdown",
            reply_markup: getBranchesKeyboard("user_select_branch")
        });
    }
});

bot.callbackQuery("cancel_action", async (ctx) => {
    ctx.session.step = "idle";
    ctx.session.tempLink = {};
    if (ctx.callbackQuery.message) {
        await ctx.editMessageText("🏠 Главное меню", { reply_markup: undefined });
        // Перезапуск меню
        if (isUserAdmin(ctx.from.id)) {
            await ctx.reply("Панель управления:", {
                reply_markup: new InlineKeyboard().text("➕ Создать", "admin_add").row().text("🗑 Удалить", "admin_delete_list").row().text("📊 Аналитика", "admin_analytics")
            });
        } else {
            await ctx.reply(`📂 **Выберите филиал:**`, { reply_markup: getBranchesKeyboard("user_select_branch") });
        }
    }
});

// Админ: Добавление
bot.callbackQuery("admin_add", async (ctx) => {
    ctx.session.step = "awaiting_title";
    await ctx.editMessageText("✏️ Введите название ссылки:", { reply_markup: new InlineKeyboard().text("❌ Отмена", "cancel_action") });
});

bot.on("message:text", async (ctx, next) => {
    if (!isUserAdmin(ctx.from.id) || ctx.session.step === "idle") return next();
    const text = ctx.message.text;

    if (ctx.session.step === "awaiting_title") {
        ctx.session.tempLink.title = text;
        ctx.session.step = "awaiting_url";
        await ctx.reply(`🔗 Название: **${text}**. Теперь отправьте ссылку:`, { parse_mode: "Markdown", reply_markup: new InlineKeyboard().text("❌ Отмена", "cancel_action") });
        return;
    }
    if (ctx.session.step === "awaiting_url") {
        if (!text.startsWith("http")) return ctx.reply("⚠️ Ссылка должна начинаться с http/https");
        ctx.session.tempLink.url = text;
        ctx.session.step = "awaiting_branch";
        await ctx.reply(`🏢 Выберите филиал:`, { reply_markup: getBranchesKeyboard("admin_save_branch") });
        return;
    }
});

bot.callbackQuery(/^admin_save_branch_(.+)$/, async (ctx) => {
    const branchKey = ctx.match[1] as Branch;
    const temp = ctx.session.tempLink;
    if (!temp.title || !temp.url) return ctx.answerCallbackQuery("Ошибка сессии");

    await LinkRepository.add({
        id: uuidv4(),
        title: temp.title,
        url: temp.url,
        branch: branchKey,
        adminId: ctx.from.id,
        adminName: ctx.from.first_name || "Admin",
        createdAt: new Date().toISOString(),
        clicks: 0
    });
    ctx.session.step = "idle";
    ctx.session.tempLink = {};
    await ctx.editMessageText("✅ Сохранено!", { reply_markup: new InlineKeyboard().text("➕ Еще", "admin_add").text("🏠 Меню", "cancel_action") });
});

// Админ: Удаление (Poka-Yoke)
bot.callbackQuery("admin_delete_list", showDeleteList);

bot.callbackQuery(/^admin_ask_del_(.+)$/, async (ctx) => {
    const id = ctx.match[1];
    const link = await LinkRepository.getById(id);
    if (!link) { await ctx.answerCallbackQuery("Уже удалено"); return showDeleteList(ctx); }
    await ctx.editMessageText(`⚠️ Удалить **${link.title}**?`, { parse_mode: "Markdown", reply_markup: new InlineKeyboard().text("✅ Да", `admin_execute_del_${id}`).row().text("❌ Нет", "admin_delete_list") });
});

bot.callbackQuery(/^admin_execute_del_(.+)$/, async (ctx) => {
    await LinkRepository.delete(ctx.match[1]);
    await ctx.answerCallbackQuery("✅ Удалено");
    await showDeleteList(ctx);
});

// Админ: Аналитика
bot.callbackQuery("admin_analytics", async (ctx) => {
    const top = await LinkRepository.getTopLinks(10);
    let msg = "📊 **ТОП ссылок:**\n\n" + (top.length ? top.map((l, i) => `${i+1}. ${l.title} (${l.clicks})`).join("\n") : "_Нет данных_");
    await ctx.editMessageText(msg, { parse_mode: "Markdown", reply_markup: new InlineKeyboard().text("🔙 Назад", "cancel_action") });
});

// Юзер: Получение ссылок
bot.callbackQuery(/^user_select_branch_(.+)$/, async (ctx) => {
    const branch = ctx.match[1] as Branch;
    const links = await LinkRepository.getLinksForUser(branch);
    const kb = new InlineKeyboard();
    
    if (links.length === 0) {
        kb.text("🔙 Назад", "back_to_branches");
        const txt = `🏢 **${BranchNames[branch]}**\n\n😔 Пусто`;
        await ctx.editMessageText(txt, { parse_mode: "Markdown", reply_markup: kb });
    } else {
        links.forEach(l => kb.text(`${l.branch === 'all' ? '🌐' : '📄'} ${l.title}`, `user_open_link_${l.id}`).row());
        kb.text("🔙 Назад", "back_to_branches");
        const txt = `🏢 **${BranchNames[branch]}**\nВыберите документ:`;
        await ctx.editMessageText(txt, { parse_mode: "Markdown", reply_markup: kb });
    }
});

bot.callbackQuery(/^user_open_link_(.+)$/, async (ctx) => {
    const id = ctx.match[1];
    const link = await LinkRepository.getById(id);
    if (!link) return ctx.answerCallbackQuery("Устарело");
    
    await LinkRepository.incrementClick(id);
    
    await ctx.reply(`📄 **${link.title}**\n⬇️ **Ссылка:**\n${link.url}`, { link_preview_options: { is_disabled: true }, parse_mode: "Markdown" });
    await ctx.answerCallbackQuery();
});

bot.callbackQuery("back_to_branches", async (ctx) => {
    await ctx.editMessageText("📂 **Выберите филиал:**", { reply_markup: getBranchesKeyboard("user_select_branch"), parse_mode: "Markdown" });
});
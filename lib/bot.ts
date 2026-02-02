import { Bot, Context, session, SessionFlavor, InlineKeyboard, GrammyError, HttpError } from "grammy";
import { v4 as uuidv4 } from "uuid";
import { LinkRepository } from "@/lib/db";
import { Branch, BranchNames, SessionData } from "@/lib/types";

// 1. Проверка токена
if (!process.env.BOT_TOKEN) throw new Error("Нет BOT_TOKEN в .env");

const ADMIN_IDS = (process.env.ADMIN_IDS || "").split(",").map(id => parseInt(id.trim()));

type MyContext = Context & SessionFlavor<SessionData>;

// 2. Инициализация бота
export const bot = new Bot<MyContext>(process.env.BOT_TOKEN);

// 3. Подключение сессий
bot.use(session({ 
    initial: (): SessionData => ({ step: "idle", tempLink: {} }) 
}));

// 4. ГЛОБАЛЬНЫЙ ЛОВЕЦ ОШИБОК (Критически важно для отладки)
bot.catch((err) => {
    const ctx = err.ctx;
    console.error(`🔥 Ошибка при обработке update ${ctx.update.update_id}:`);
    const e = err.error;
    if (e instanceof GrammyError) {
        console.error("Telegram API Error:", e.description);
    } else if (e instanceof HttpError) {
        console.error("Could not contact Telegram:", e);
    } else {
        console.error("Unknown error:", e);
    }
});

// --- ХЕЛПЕРЫ ---
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

// Функция показа списка удаления
async function showDeleteList(ctx: MyContext) {
    if (!ctx.from) return;
    try {
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
    } catch (e) {
        console.error("Ошибка в showDeleteList:", e);
        await ctx.reply("Ошибка базы данных при загрузке списка.");
    }
}

// --- ТЕСТОВАЯ КОМАНДА ---
bot.command("ping", async (ctx) => {
    console.log(`🏓 PING получен от ${ctx.from?.id}`);
    await ctx.reply("Pong! Бот работает и видит ваши сообщения.");
});

// --- КОМАНДА START ---
bot.command("start", async (ctx) => {
    console.log(`🚀 START от ${ctx.from?.id}`);
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

// --- КНОПКА ОТМЕНЫ ---
bot.callbackQuery("cancel_action", async (ctx) => {
    ctx.session.step = "idle";
    ctx.session.tempLink = {};
    
    try {
        if (isUserAdmin(ctx.from.id)) {
            await ctx.editMessageText("👨‍💻 **Админ панель**", {
                parse_mode: "Markdown",
                reply_markup: new InlineKeyboard().text("➕ Создать", "admin_add").row().text("🗑 Удалить", "admin_delete_list").row().text("📊 Аналитика", "admin_analytics")
            });
        } else {
             await ctx.editMessageText(`📂 **Выберите филиал:**`, { reply_markup: getBranchesKeyboard("user_select_branch"), parse_mode: "Markdown" });
        }
    } catch (e) {
        // Если сообщение слишком старое, отправляем новое
        await ctx.reply("🏠 Главное меню");
    }
});

// =======================
// АДМИН: ДОБАВЛЕНИЕ
// =======================
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

    try {
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
    } catch (e) {
        await ctx.reply("❌ Ошибка при сохранении в БД.");
    }
});

// =======================
// АДМИН: УДАЛЕНИЕ
// =======================
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

// =======================
// АДМИН: АНАЛИТИКА
// =======================
bot.callbackQuery("admin_analytics", async (ctx) => {
    try {
        const top = await LinkRepository.getTopLinks(10);
        let msg = "📊 **ТОП ссылок:**\n\n" + (top.length ? top.map((l, i) => `${i+1}. ${l.title} (${l.clicks})`).join("\n") : "_Нет данных_");
        await ctx.editMessageText(msg, { parse_mode: "Markdown", reply_markup: new InlineKeyboard().text("🔙 Назад", "cancel_action") });
    } catch (e) {
        await ctx.reply("Ошибка получения аналитики.");
    }
});

// =======================
// ПОЛЬЗОВАТЕЛЬ
// =======================
bot.callbackQuery(/^user_select_branch_(.+)$/, async (ctx) => {
    const branch = ctx.match[1] as Branch;
    try {
        const links = await LinkRepository.getLinksForUser(branch);
        const kb = new InlineKeyboard();
        if (links.length === 0) kb.text("🔙 Назад", "back_to_branches");
        else {
            links.forEach(l => kb.text(`${l.branch === 'all' ? '🌐' : '📄'} ${l.title}`, `user_open_link_${l.id}`).row());
            kb.text("🔙 Назад", "back_to_branches");
        }
        const txt = links.length ? `🏢 **${BranchNames[branch]}**\nВыберите документ:` : `😔 Пусто`;
        await ctx.editMessageText(txt, { parse_mode: "Markdown", reply_markup: kb });
    } catch (e) {
        await ctx.reply("Ошибка загрузки ссылок.");
    }
});

bot.callbackQuery(/^user_open_link_(.+)$/, async (ctx) => {
    const id = ctx.match[1];
    const link = await LinkRepository.getById(id);
    if (!link) return ctx.answerCallbackQuery("Устарело");
    
    // Не блокируем ответ, если статистика не записалась
    LinkRepository.incrementClick(id).catch(e => console.error("Ошибка клика", e));
    
    await ctx.reply(`📄 **${link.title}**\n⬇️ **Ссылка:**\n${link.url}`, { link_preview_options: { is_disabled: true }, parse_mode: "Markdown" });
    await ctx.answerCallbackQuery();
});

bot.callbackQuery("back_to_branches", async (ctx) => {
    await ctx.editMessageText("📂 **Выберите филиал:**", { reply_markup: getBranchesKeyboard("user_select_branch"), parse_mode: "Markdown" });
});
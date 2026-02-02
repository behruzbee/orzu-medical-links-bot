import { Bot, Context, session, SessionFlavor, GrammyError, HttpError } from "grammy";
import { SessionData } from "@/lib/types";

if (!process.env.BOT_TOKEN) throw new Error("Нет BOT_TOKEN в .env");

type MyContext = Context & SessionFlavor<SessionData>;

export const bot = new Bot<MyContext>(process.env.BOT_TOKEN);

bot.use(session({ 
    initial: (): SessionData => ({ step: "idle", tempLink: {} }) 
}));

bot.catch((err) => {
    const ctx = err.ctx;
    console.error(`🔥 Ошибка update ${ctx.update.update_id}:`, err.error);
});

// Команда /start
bot.command("start", async (ctx) => {
    // 👇 Сюда вставь свой актуальный домен на Vercel
    const domain = "https://links-bot-tau.vercel.app"; 
    
    await ctx.reply(
        `👋 **База знаний Orzu Medical**\n\n` +
        `Теперь бот работает как приложение! 📱\n` +
        `Нажмите кнопку ниже, чтобы открыть базу или добавить документы.`, 
        {
            parse_mode: "Markdown",
            reply_markup: {
                keyboard: [
                    [ { text: "📂 Открыть базу знаний", web_app: { url: domain } } ],
                    [ { text: "⚙️ Админка (Добавить)", web_app: { url: `${domain}/admin` } } ]
                ],
                resize_keyboard: true
            }
        }
    );
});

// Команда /ping
bot.command("ping", async (ctx) => {
    await ctx.reply("Pong! 🏓 Бот работает в режиме Mini App.");
});
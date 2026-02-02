import { Bot, Context, session, SessionFlavor, GrammyError, HttpError } from "grammy";
import { SessionData } from "@/lib/types";

if (!process.env.BOT_TOKEN) throw new Error("Нет BOT_TOKEN в .env");

type MyContext = Context & SessionFlavor<SessionData>;

export const bot = new Bot<MyContext>(process.env.BOT_TOKEN);

bot.use(session({ 
    initial: (): SessionData => ({ step: "idle", tempLink: {} }) 
}));

bot.catch((err) => {
    console.error(`🔥 Ошибка:`, err.error);
});

// Команда /start
bot.command("start", async (ctx) => {
    // 👇 ВАШ ДОМЕН (Убедитесь, что ссылка точная)
    const domain = "https://links-bot-tau.vercel.app"; 
    
    await ctx.reply(
        `👋 **База знаний Orzu Medical**\n\n` +
        `Для входа в Админку нажмите кнопку **под этим сообщением**.\n` +
        `Только так Телеграм передаст ваш ID.`, 
        {
            parse_mode: "Markdown",
            reply_markup: {
                // 👇 ИСПОЛЬЗУЕМ INLINE КЛАВИАТУРУ (Кнопки прозрачные под текстом)
                // Это гарантирует передачу initData
                inline_keyboard: [
                    [
                        { text: "📂 Открыть базу", web_app: { url: domain } }
                    ],
                    [
                        { text: "⚙️ Админка (Вход)", web_app: { url: `${domain}/admin` } }
                    ]
                ]
            }
        }
    );
});

bot.command("ping", async (ctx) => {
    await ctx.reply("Pong! 🏓");
});
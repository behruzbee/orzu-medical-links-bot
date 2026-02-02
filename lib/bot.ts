import { Bot, Context, session, SessionFlavor, GrammyError, HttpError } from "grammy";
import { SessionData } from "@/lib/types";

// 1. Проверка токена
if (!process.env.BOT_TOKEN) throw new Error("Нет BOT_TOKEN в .env");

// Типы контекста (оставляем сессии для совместимости, даже если не используем активно)
type MyContext = Context & SessionFlavor<SessionData>;

// 2. Инициализация бота
export const bot = new Bot<MyContext>(process.env.BOT_TOKEN);

// 3. Подключение сессий (сбрасываем состояние в idle)
bot.use(session({ 
    initial: (): SessionData => ({ step: "idle", tempLink: {} }) 
}));

// 4. ГЛОБАЛЬНЫЙ ЛОВЕЦ ОШИБОК
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

// --- КОМАНДЫ ---

// Команда /start - Главная точка входа
bot.command("start", async (ctx) => {
    // ⚠️ ВАЖНО: Убедитесь, что здесь ссылка на ваш Vercel проект
    const domain = "https://links-bot-tau.vercel.app"; 
    
    await ctx.reply(
        `👋 **База знаний Orzu Medical**\n\n` +
        `Теперь бот работает как приложение! 📱\n` +
        `Нажмите кнопку ниже, чтобы открыть базу или добавить документы.`, 
        {
            parse_mode: "Markdown",
            reply_markup: {
                // Persistent Keyboard (Меню внизу экрана)
                keyboard: [
                    [
                        // Кнопка открывает Главную страницу (Поиск)
                        { text: "📂 Открыть базу знаний", web_app: { url: domain } } 
                    ],
                    [
                        // Кнопка открывает Админку (Добавление)
                        { text: "⚙️ Админка (Добавить)", web_app: { url: `${domain}/admin` } } 
                    ]
                ],
                resize_keyboard: true // Чтобы кнопки не были огромными
            }
        }
    );
});

bot.command("ping", async (ctx) => {
    await ctx.reply("Pong! 🏓 Бот работает в режиме Mini App.");
});
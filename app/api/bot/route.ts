import { webhookCallback } from "grammy";
import { bot } from "@/lib/bot";

export const dynamic = 'force-dynamic';

export const POST = async (req: Request) => {
    console.log("📨 (Webhook) Получен запрос от Telegram"); // <--- ЛОГ 1
    
    try {
        // Запускаем обработчик grammY
        return await webhookCallback(bot, "std/http")(req);
    } catch (e) {
        console.error("❌ (Webhook) Ошибка обработки:", e);
        return new Response("Error", { status: 500 });
    }
};
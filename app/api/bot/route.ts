import { bot } from "@/lib/bot";
import { webhookCallback } from "grammy";

// Заставляем Vercel не кешировать функцию
export const dynamic = 'force-dynamic';

export const POST = async (req: Request) => {
    console.log("📨 (Webhook) Пришел запрос от Telegram!");
    
    try {
        const url = new URL(req.url);
        if (url.searchParams.get('secret') !== process.env.BOT_TOKEN) {
           console.log("❌ (Webhook) НЕАВТОРИЗОВАННЫЙ ЗАПРОС!");
           return new Response("Unauthorized", { status: 401 });
        }

        // Создаем callback функцию
        const handler = webhookCallback(bot, "std/http");
        
        // Запускаем обработку
        const response = await handler(req);
        
        console.log("✅ (Webhook) Успешно обработано!");
        return response;
    } catch (e: any) {
        console.error("❌ (Webhook) КРИТИЧЕСКАЯ ОШИБКА:", e.message);
        return new Response(JSON.stringify({ error: e.message }), { status: 500 });
    }
};
import { bot } from "@/lib/bot";
import { webhookCallback } from "grammy";

export const dynamic = 'force-dynamic';

// Эта функция обрабатывает POST запросы от Telegram
export const POST = async (req: Request) => {
    console.log("📨 POST запрос пришел!"); 
    
    try {
        // Создаем обработчик для Vercel/Next.js
        const handleUpdate = webhookCallback(bot, "std/http");
        
        // Передаем запрос в grammY
        return await handleUpdate(req);
    } catch (e) {
        console.error("❌ Ошибка в route.ts:", e);
        return new Response("Error", { status: 500 });
    }
};
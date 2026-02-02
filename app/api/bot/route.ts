import { bot } from "@/lib/bot";
import { webhookCallback } from "grammy";

// 1. Обязательно для Vercel: отключаем статический кеш
export const dynamic = 'force-dynamic';

export const POST = async (req: Request) => {
    console.log("📨 (Webhook) Пришел POST запрос");

    try {
        // 2. Читаем JSON, чтобы убедиться, что данные пришли
        // (Это нужно для отладки, чтобы видеть ID обновления в логах)
        const body = await req.json();
        console.log("📦 Update ID:", body.update_id, "| Message:", body.message?.text || body.callback_query?.data);

        // 3. Создаем обработчик grammY
        const handleUpdate = webhookCallback(bot, "std/http");

        // 4. ВАЖНО: Так как мы уже прочитали тело запроса (req.json) выше,
        // поток данных "пуст". Нам нужно создать новый запрос с тем же телом
        // для передачи в grammY.
        const newReq = new Request(req.url, {
            method: "POST",
            headers: req.headers,
            body: JSON.stringify(body),
        });

        // 5. Передаем управление боту
        return await handleUpdate(newReq);

    } catch (e: any) {
        console.error("❌ Ошибка в route.ts:", e.message);
        // Возвращаем ошибку, но статус 200, чтобы Telegram не спамил повторами,
        // если ошибка на нашей стороне (опционально, можно и 500)
        return new Response(JSON.stringify({ error: e.message }), { status: 500 });
    }
};
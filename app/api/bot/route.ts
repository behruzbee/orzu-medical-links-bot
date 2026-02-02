import { bot } from "@/lib/bot";
import { webhookCallback } from "grammy";

export const dynamic = 'force-dynamic';

export const POST = async (req: Request) => {
    try {
        const handleUpdate = webhookCallback(bot, "std/http");
        return await handleUpdate(req);
    } catch (e: any) {
        console.error("❌ Error in bot route:", e.message);
        return new Response(JSON.stringify({ error: e.message }), { status: 500 });
    }
};
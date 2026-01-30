import { webhookCallback } from "grammy";
import { bot } from "@/lib/bot";

// 👇 ДОБАВИТЬ ЭТУ СТРОКУ (Настройка Vercel прямо в коде)
export const maxDuration = 60; 
export const dynamic = 'force-dynamic';

export const POST = webhookCallback(bot, "std/http");
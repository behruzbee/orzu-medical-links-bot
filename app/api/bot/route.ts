// app/api/bot/route.ts
import { webhookCallback } from "grammy";
import { bot } from "@/lib/bot";

// 👇 Добавляем эту строку
export const maxDuration = 60; // Устанавливает лимит в 60 секунд
export const dynamic = 'force-dynamic'; // Гарантирует, что функция не кешируется

export const POST = webhookCallback(bot, "std/http");
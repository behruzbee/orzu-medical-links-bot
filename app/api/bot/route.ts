import { bot } from "@/lib/bot";
import { webhookCallback } from "grammy";

export const dynamic = "force-dynamic";

const handler = webhookCallback(bot, "std/http");

export async function POST(req: Request) {
  return handler(req);
}

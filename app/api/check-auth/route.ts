import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        // Приводим ID к строке, чтобы сравнение было надежным
        const userId = String(body.userId || "").trim();

        // 1. Получаем список из ENV
        const adminIdsString = process.env.ADMIN_IDS || "";
        
        // 2. Создаем массив строк (чистим пробелы)
        const adminIds = adminIdsString
            .split(",")
            .map(id => id.trim()); // Убираем пробелы вокруг ID в переменной

        // 3. ЛОГИРОВАНИЕ (Смотрите Vercel Logs)
        console.log("------------------------------------------------");
        console.log(`📥 Пришел UserID: '${userId}'`);
        console.log(`📋 Список AdminID:`, adminIds);
        
        const match = adminIds.includes(userId);
        console.log(`🔐 Результат проверки: ${match ? "ДОСТУП РАЗРЕШЕН" : "ОТКАЗ"}`);
        console.log("------------------------------------------------");

        // 4. Проверка
        if (match) {
            return NextResponse.json({ isAdmin: true });
        } else {
            return NextResponse.json({ isAdmin: false }, { status: 403 });
        }

    } catch (e: any) {
        console.error("Auth Error:", e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
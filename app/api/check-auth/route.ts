import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
    try {
        const { userId } = await request.json();

        // 1. Получаем список админов из .env
        // Превращаем строку "123, 456" в массив чисел [123, 456]
        const adminIdsString = process.env.ADMIN_IDS || "";
        const adminIds = adminIdsString.split(",").map(id => parseInt(id.trim()));

        console.log(`🔍 Проверка ID: ${userId}. Разрешенные: ${adminIds.join(", ")}`);

        // 2. Проверяем
        if (adminIds.includes(Number(userId))) {
            return NextResponse.json({ isAdmin: true });
        } else {
            return NextResponse.json({ isAdmin: false }, { status: 403 });
        }

    } catch (e) {
        console.error("Auth Error:", e);
        return NextResponse.json({ error: 'Server Error' }, { status: 500 });
    }
}
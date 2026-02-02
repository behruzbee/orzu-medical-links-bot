import { NextResponse } from 'next/server';
import { LinkRepository } from '@/lib/db';
import { Branch, LinkItem } from '@/lib/types';
import { v4 as uuidv4 } from "uuid";

export const dynamic = 'force-dynamic';

// GET: Получить список ссылок
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const branch = searchParams.get('branch');

    if (!branch) return NextResponse.json({ error: 'Branch required' }, { status: 400 });

    try {
        const links = await LinkRepository.getLinksForUser(branch as Branch);
        return NextResponse.json(links);
    } catch (e) {
        return NextResponse.json({ error: 'DB Error' }, { status: 500 });
    }
}

// POST: Добавить новую ссылку (из Админки)
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { title, url, branch, adminId, adminName } = body;

        const newLink: LinkItem = {
            id: uuidv4(),
            title, url, branch,
            adminId: adminId || 0,
            adminName: adminName || 'Web',
            createdAt: new Date().toISOString(),
            clicks: 0
        };

        await LinkRepository.add(newLink);
        return NextResponse.json({ success: true, link: newLink });
    } catch (e) {
        return NextResponse.json({ error: 'DB Save Error' }, { status: 500 });
    }
}
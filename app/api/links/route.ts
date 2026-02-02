import { NextResponse } from 'next/server';
import { LinkRepository } from '@/lib/db';
import { Branch, LinkItem } from '@/lib/types';
import { v4 as uuidv4 } from "uuid";

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

// GET - Получение ссылок (как было)
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const branch = searchParams.get('branch');

    if (!branch) {
        return NextResponse.json({ error: 'Branch is required' }, { status: 400 });
    }

    try {
        const links = await LinkRepository.getLinksForUser(branch as Branch);
        return NextResponse.json(links);
    } catch (e) {
        return NextResponse.json({ error: 'DB Error' }, { status: 500 });
    }
}

// POST - Сохранение новой ссылки (НОВОЕ!)
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { title, url, branch, adminId, adminName } = body;

        if (!title || !url || !branch) {
            return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
        }

        const newLink: LinkItem = {
            id: uuidv4(),
            title,
            url,
            branch,
            adminId: adminId || 0,
            adminName: adminName || 'Web',
            createdAt: new Date().toISOString(),
            clicks: 0
        };

        await LinkRepository.add(newLink);
        
        return NextResponse.json({ success: true, link: newLink });
    } catch (e) {
        console.error("API POST Error:", e);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
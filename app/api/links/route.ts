import { NextResponse } from 'next/server';
import { LinkRepository } from '@/lib/db';
import { Branch } from '@/lib/types';

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
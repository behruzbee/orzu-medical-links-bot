import { NextResponse } from 'next/server';
import { LinkRepository } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
    try {
        const { id } = await request.json();
        if (id) {
            await LinkRepository.incrementClick(id);
        }
        return NextResponse.json({ success: true });
    } catch (e) {
        return NextResponse.json({ error: 'Tracking Error' }, { status: 500 });
    }
}
import { NextResponse } from 'next/server';
import { LinkRepository } from '@/lib/db';

export async function POST(request: Request) {
    try {
        const { id } = await request.json();
        if (id) {
            await LinkRepository.incrementClick(id);
        }
        return NextResponse.json({ success: true });
    } catch (e) {
        return NextResponse.json({ error: 'Error tracking' }, { status: 500 });
    }
}
import { getEvents, addEvent } from '@hyliren/shared/src/server/data-store';
import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ events: getEvents() });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const event = addEvent(body);
  return NextResponse.json({ ok: true, event });
}

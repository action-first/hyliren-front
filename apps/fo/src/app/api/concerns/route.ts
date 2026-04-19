import { getConcerns, addConcern } from '@hyliren/shared/src/server/data-store';
import { NextRequest, NextResponse } from 'next/server';
import { createConcernSchema } from './schema';

export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get('userId');
  let concerns = getConcerns().filter(c => !c.deletedAt);
  if (userId) concerns = concerns.filter(c => c.userId === userId);
  concerns.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return NextResponse.json(concerns);
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: '유효한 JSON 요청이 필요합니다.' }, { status: 400 });
  }

  const parsed = createConcernSchema.safeParse(body);
  if (!parsed.success) {
    const firstError = parsed.error.issues[0];
    return NextResponse.json(
      { error: firstError?.message || '입력값이 올바르지 않습니다.' },
      { status: 400 },
    );
  }

  addConcern(parsed.data);
  return NextResponse.json({ ok: true, id: parsed.data.id });
}

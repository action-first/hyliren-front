import { NextRequest, NextResponse } from 'next/server';
import {
  getProcedureBySlug,
  addProcedureBookmark, removeProcedureBookmark,
} from '@hyliren/shared/src/server/data-store';

async function resolveProcedureId(slug: string) {
  const procedure = getProcedureBySlug(slug);
  return procedure?.id ?? null;
}

/**
 * POST /api/procedures/[slug]/bookmark  { userId }
 * 북마크 추가 (idempotent — 이미 있으면 기존 리턴)
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const { userId } = await req.json();
  if (!userId) return NextResponse.json({ error: 'userId 필수' }, { status: 400 });

  const procedureId = await resolveProcedureId(slug);
  if (!procedureId) return NextResponse.json({ error: '시술을 찾을 수 없습니다' }, { status: 404 });

  const bookmark = addProcedureBookmark(userId, procedureId);
  return NextResponse.json({ ok: true, bookmark });
}

/**
 * DELETE /api/procedures/[slug]/bookmark?userId=...
 * 북마크 제거
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const userId = req.nextUrl.searchParams.get('userId');
  if (!userId) return NextResponse.json({ error: 'userId 필수' }, { status: 400 });

  const procedureId = await resolveProcedureId(slug);
  if (!procedureId) return NextResponse.json({ error: '시술을 찾을 수 없습니다' }, { status: 404 });

  const ok = removeProcedureBookmark(userId, procedureId);
  return NextResponse.json({ ok });
}

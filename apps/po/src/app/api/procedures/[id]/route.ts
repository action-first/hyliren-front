import { NextRequest, NextResponse } from 'next/server';
import {
  getProcedureById, getProcedureVariants,
  updateProcedure, softDeleteProcedure,
} from '@hyliren/shared/src/server/data-store';
import type { Procedure } from '@hyliren/shared';
import { updateProcedureSchema } from '../schema';

/**
 * GET /api/procedures/[id]?memberId=...
 * PO — 본인 시술 상세 + variants. i18n 원본 그대로 반환 (편집 UI 가 locale 탭으로 다룸).
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const memberId = req.nextUrl.searchParams.get('memberId');

  const procedure = getProcedureById(id);
  if (!procedure) return NextResponse.json({ error: '시술을 찾을 수 없습니다' }, { status: 404 });
  if (memberId && procedure.memberId !== memberId) {
    return NextResponse.json({ error: '권한이 없습니다' }, { status: 403 });
  }

  const variants = getProcedureVariants(id);
  return NextResponse.json({ procedure, variants });
}

/**
 * PATCH /api/procedures/[id]?memberId=...
 * 본체 필드 부분 업데이트 + i18n 은 locale 단위 upsert (기존 번역 유지).
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const memberId = req.nextUrl.searchParams.get('memberId');

  const existing = getProcedureById(id);
  if (!existing) return NextResponse.json({ error: '시술을 찾을 수 없습니다' }, { status: 404 });
  if (memberId && existing.memberId !== memberId) {
    return NextResponse.json({ error: '권한이 없습니다' }, { status: 403 });
  }

  let body: unknown;
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: '유효한 JSON 요청이 필요합니다' }, { status: 400 }); }

  const parsed = updateProcedureSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || '입력값이 올바르지 않습니다' },
      { status: 400 },
    );
  }

  const patch = parsed.data;
  const next: Partial<Procedure> = { ...patch };

  // i18n 은 기존 + patch locale 병합 (locale 단위 upsert)
  if (patch.i18n) {
    next.i18n = { ...existing.i18n, ...patch.i18n };
  }

  // draft → published 전환 시 publishedAt 세팅
  if (patch.status === 'published' && existing.status !== 'published') {
    next.publishedAt = new Date().toISOString();
  }

  const updated = updateProcedure(id, next);
  return NextResponse.json({ ok: true, procedure: updated });
}

/**
 * DELETE /api/procedures/[id]?memberId=...
 * Soft delete. status → 'archived'.
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const memberId = req.nextUrl.searchParams.get('memberId');

  const existing = getProcedureById(id);
  if (!existing) return NextResponse.json({ error: '시술을 찾을 수 없습니다' }, { status: 404 });
  if (memberId && existing.memberId !== memberId) {
    return NextResponse.json({ error: '권한이 없습니다' }, { status: 403 });
  }

  const archived = softDeleteProcedure(id);
  return NextResponse.json({ ok: true, procedure: archived });
}

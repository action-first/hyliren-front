import { NextRequest, NextResponse } from 'next/server';
import {
  getProcedureById, getProcedureDetail, getProcedureVariants,
  updateProcedure, updateProcedureDetail, softDeleteProcedure,
} from '@hyliren/shared/src/server/data-store';
import { updateProcedureSchema } from '../schema';

const PROCEDURE_KEYS = [
  'title', 'titleZh', 'primaryArea', 'procedureType',
  'heroImageUrl', 'slug', 'status',
] as const;

const DETAIL_KEYS = [
  'description', 'descriptionZh', 'indications',
  'precautions', 'precautionsZh', 'galleryImageUrls',
  'basePrice', 'baseAnesthesia', 'baseDurationMinutes',
  'baseRecoveryDays', 'baseHospitalStayDays',
] as const;

/**
 * GET /api/procedures/[id]?memberId=...
 * PO 자신의 시술 상세 + detail + variants. 본인 소유만 접근 가능.
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

  const detail = getProcedureDetail(id);
  const variants = getProcedureVariants(id);
  return NextResponse.json({ procedure, detail, variants });
}

/**
 * PATCH /api/procedures/[id]?memberId=...
 * Procedure + Detail 필드 자유 조합 업데이트.
 * status 전환 (draft→published, published→archived) 포함.
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
  const procedurePatch: Record<string, unknown> = {};
  const detailPatch: Record<string, unknown> = {};
  for (const k of PROCEDURE_KEYS) {
    if (k in patch) procedurePatch[k] = patch[k];
  }
  for (const k of DETAIL_KEYS) {
    if (k in patch) detailPatch[k] = patch[k];
  }

  // status 전환이 draft → published 면 publishedAt 타임스탬프 세팅
  if (procedurePatch.status === 'published' && existing.status !== 'published') {
    procedurePatch.publishedAt = new Date().toISOString();
  }

  let updatedProcedure = existing;
  if (Object.keys(procedurePatch).length > 0) {
    updatedProcedure = updateProcedure(id, procedurePatch) ?? existing;
  }
  let updatedDetail = getProcedureDetail(id);
  if (Object.keys(detailPatch).length > 0) {
    updatedDetail = updateProcedureDetail(id, detailPatch);
  }

  return NextResponse.json({
    ok: true,
    procedure: updatedProcedure,
    detail: updatedDetail,
  });
}

/**
 * DELETE /api/procedures/[id]?memberId=...
 * Soft delete. status → 'archived', deletedAt 세팅.
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

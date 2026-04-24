import { NextRequest, NextResponse } from 'next/server';
import {
  getProcedureById, getProcedureVariants,
  addProcedureVariant, updateProcedureVariant,
} from '@hyliren/shared/src/server/data-store';
import type { ProcedureVariant } from '@hyliren/shared';
import { variantSchema } from '../../schema';

/**
 * POST /api/procedures/[id]/variants?memberId=...
 * 새 variant 추가. isDefault=true 로 들어오면 기존 default 를 false 로 해제.
 */
export async function POST(
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

  let body: unknown;
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: '유효한 JSON 요청이 필요합니다' }, { status: 400 }); }

  const parsed = variantSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || '입력값이 올바르지 않습니다' },
      { status: 400 },
    );
  }

  const now = new Date().toISOString();
  const v = parsed.data;

  // 새 variant 가 default 면 기존 default 를 해제
  if (v.isDefault) {
    const existing = getProcedureVariants(id);
    for (const ex of existing) {
      if (ex.isDefault) updateProcedureVariant(ex.id, { isDefault: false });
    }
  }

  const variant: ProcedureVariant = {
    id: `pv-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    procedureId: id,
    name: v.name,
    nameZh: v.nameZh,
    description: v.description ?? null,
    descriptionZh: v.descriptionZh ?? null,
    price: v.price ?? null,
    anesthesia: v.anesthesia ?? null,
    durationMinutes: v.durationMinutes ?? null,
    recoveryDays: v.recoveryDays ?? null,
    hospitalStayDays: v.hospitalStayDays ?? null,
    sortOrder: v.sortOrder,
    isDefault: v.isDefault,
    createdAt: now,
    updatedAt: now,
  };
  addProcedureVariant(variant);

  return NextResponse.json({ ok: true, variant });
}

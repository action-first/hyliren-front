import { NextRequest, NextResponse } from 'next/server';
import {
  getProcedureById, getProcedureVariants,
  addProcedureVariant, updateProcedureVariant,
} from '@hyliren/shared/src/server/data-store';
import type { ProcedureVariant } from '@hyliren/shared';
import { variantSchema } from '../../schema';
import { callBackend, isRealMode, proxyErrorToResponse } from '@/lib/api/partner-proxy';

/**
 * POST /api/procedures/[id]/variants?memberId=...
 * 새 variant 추가. isDefault=true 로 들어오면 기존 default 해제.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  let body: unknown;
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: '유효한 JSON 요청이 필요합니다' }, { status: 400 }); }

  if (isRealMode()) {
    try {
      // 백엔드는 { id } 만 반환. PO 클라이언트는 { variant } 를 기대하지만 실제
      // 반환값은 callsite 에서 사용되지 않음 (edit 페이지가 refetch 로 동기화).
      // 호환성 위해 { ok: true, id } 로 반환하고 PO 클라이언트 측 타입은 별도 PR 로 정리.
      const data = await callBackend<{ id: string }>(req, {
        method: 'POST',
        path: `/procedures/${id}/variants`,
        body,
      });
      return NextResponse.json({ ok: true, ...data }, { status: 201 });
    } catch (e) {
      return proxyErrorToResponse(e);
    }
  }

  const memberId = req.nextUrl.searchParams.get('memberId');

  const procedure = getProcedureById(id);
  if (!procedure) return NextResponse.json({ error: '시술을 찾을 수 없습니다' }, { status: 404 });
  if (memberId && procedure.memberId !== memberId) {
    return NextResponse.json({ error: '권한이 없습니다' }, { status: 403 });
  }

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
    price: v.price ?? null,
    anesthesia: v.anesthesia ?? null,
    durationMinutes: v.durationMinutes ?? null,
    recoveryDays: v.recoveryDays ?? null,
    hospitalStayDays: v.hospitalStayDays ?? null,
    sortOrder: v.sortOrder,
    isDefault: v.isDefault,
    i18n: v.i18n,
    createdAt: now,
    updatedAt: now,
  };
  addProcedureVariant(variant);

  return NextResponse.json({ ok: true, variant });
}

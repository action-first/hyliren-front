import { NextRequest, NextResponse } from 'next/server';
import {
  getProcedureById, getProcedureVariants,
  updateProcedureVariant, removeProcedureVariant,
} from '@hyliren/shared/src/server/data-store';
import type { ProcedureVariant } from '@hyliren/shared';
import { updateVariantSchema } from '../../../schema';
import { callBackend, isRealMode, proxyErrorToResponse } from '@/lib/api/partner-proxy';

function authorize(procedureId: string, memberId: string | null) {
  const procedure = getProcedureById(procedureId);
  if (!procedure) return { error: '시술을 찾을 수 없습니다', status: 404 } as const;
  if (memberId && procedure.memberId !== memberId) {
    return { error: '권한이 없습니다', status: 403 } as const;
  }
  return { procedure } as const;
}

/**
 * PATCH /api/procedures/[id]/variants/[variantId]?memberId=...
 * variant 부분 수정. i18n 은 locale 단위 upsert. isDefault 토글 시 기존 해제.
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; variantId: string }> },
) {
  const { id, variantId } = await params;

  let body: unknown;
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: '유효한 JSON 요청이 필요합니다' }, { status: 400 }); }

  if (isRealMode()) {
    try {
      await callBackend<void>(req, {
        method: 'PATCH',
        path: `/procedures/${id}/variants/${variantId}`,
        body,
      });
      return NextResponse.json({ ok: true });
    } catch (e) {
      return proxyErrorToResponse(e);
    }
  }

  const memberId = req.nextUrl.searchParams.get('memberId');

  const auth = authorize(id, memberId);
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const parsed = updateVariantSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || '입력값이 올바르지 않습니다' },
      { status: 400 },
    );
  }

  // 기존 variant 조회해서 i18n merge 준비
  const siblings = getProcedureVariants(id);
  const existing = siblings.find(v => v.id === variantId);
  if (!existing) return NextResponse.json({ error: '옵션을 찾을 수 없습니다' }, { status: 404 });

  const patch: Partial<Omit<ProcedureVariant, 'id' | 'procedureId'>> = { ...parsed.data };
  if (parsed.data.i18n) {
    patch.i18n = { ...existing.i18n, ...parsed.data.i18n };
  }

  // isDefault=true 로 전환 시 나머지 해제
  if (parsed.data.isDefault === true) {
    for (const s of siblings) {
      if (s.id !== variantId && s.isDefault) {
        updateProcedureVariant(s.id, { isDefault: false });
      }
    }
  }

  const updated = updateProcedureVariant(variantId, patch);
  if (!updated) return NextResponse.json({ error: '옵션을 찾을 수 없습니다' }, { status: 404 });
  return NextResponse.json({ ok: true, variant: updated });
}

/**
 * DELETE /api/procedures/[id]/variants/[variantId]?memberId=...
 * 마지막 variant 삭제 방지. default 삭제 시 다음 variant 를 default 로 승격.
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; variantId: string }> },
) {
  const { id, variantId } = await params;

  if (isRealMode()) {
    try {
      await callBackend<void>(req, {
        method: 'DELETE',
        path: `/procedures/${id}/variants/${variantId}`,
      });
      return NextResponse.json({ ok: true });
    } catch (e) {
      return proxyErrorToResponse(e);
    }
  }

  const memberId = req.nextUrl.searchParams.get('memberId');

  const auth = authorize(id, memberId);
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const variants = getProcedureVariants(id);
  if (variants.length <= 1) {
    return NextResponse.json(
      { error: '최소 1개의 옵션은 유지되어야 합니다' },
      { status: 400 },
    );
  }

  const target = variants.find(v => v.id === variantId);
  if (!target) return NextResponse.json({ error: '옵션을 찾을 수 없습니다' }, { status: 404 });

  if (target.isDefault) {
    const promoted = variants
      .filter(v => v.id !== variantId)
      .sort((a, b) => a.sortOrder - b.sortOrder)[0];
    if (promoted) updateProcedureVariant(promoted.id, { isDefault: true });
  }

  removeProcedureVariant(variantId);
  return NextResponse.json({ ok: true });
}

import { NextRequest, NextResponse } from 'next/server';
import { getProcedures, addProcedure } from '@hyliren/shared/src/server/data-store';
import { computePriceRange } from '@hyliren/shared/src/domain/procedure';
import type { Procedure, ProcedureVariant } from '@hyliren/shared';
import type { ProcedureStatus } from '@hyliren/shared/src/constants';
import { createProcedureSchema, generateSlug } from './schema';

/**
 * GET /api/procedures?memberId=...&status=...
 * PO — 자신의 시술 목록 (모든 상태 조회). locale merge 안 함 (편집은 원본 유지).
 */
export async function GET(req: NextRequest) {
  try {
    const memberId = req.nextUrl.searchParams.get('memberId');
    const status = req.nextUrl.searchParams.get('status') as ProcedureStatus | null;
    if (!memberId) {
      return NextResponse.json({ error: 'memberId 필수' }, { status: 400 });
    }
    let procedures = getProcedures().filter(p => p.memberId === memberId);
    if (status) procedures = procedures.filter(p => p.status === status);
    procedures.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    return NextResponse.json({ procedures, total: procedures.length });
  } catch {
    return NextResponse.json({ error: 'Failed to load procedures' }, { status: 500 });
  }
}

/**
 * POST /api/procedures
 * 4-step wizard 완료 시 Procedure + Variants 일괄 생성.
 * payload 에 i18n 전 locale 포함 (원본 + 번역).
 */
export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: '유효한 JSON 요청이 필요합니다' }, { status: 400 });
  }

  const parsed = createProcedureSchema.safeParse(body);
  if (!parsed.success) {
    const firstError = parsed.error.issues[0];
    return NextResponse.json(
      { error: firstError?.message || '입력값이 올바르지 않습니다' },
      { status: 400 },
    );
  }

  try {
    const data = parsed.data;
    const now = new Date().toISOString();
    const procedureId = `proc-${Date.now()}`;
    const slug = data.slug ?? generateSlug(data.procedureType);

    const variants: ProcedureVariant[] = data.variants.map((v, i) => ({
      id: `pv-${Date.now()}-${i}`,
      procedureId,
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
    }));

    const procedureCore: Procedure = {
      id: procedureId,
      memberId: data.memberId,
      slug,
      primaryArea: data.primaryArea,
      procedureType: data.procedureType,
      heroImageUrl: data.heroImageUrl || '',
      galleryImageUrls: data.galleryImageUrls,
      priceMin: 0,
      priceMax: 0,
      currency: 'KRW',
      basePrice: data.basePrice,
      baseAnesthesia: data.baseAnesthesia,
      baseDurationMinutes: data.baseDurationMinutes,
      baseRecoveryDays: data.baseRecoveryDays,
      baseHospitalStayDays: data.baseHospitalStayDays,
      status: data.status,
      sourceLocale: data.sourceLocale,
      viewCount: 0,
      bookmarkCount: 0,
      consultClickCount: 0,
      i18n: data.i18n,
      publishedAt: data.status === 'published' ? now : null,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    };

    const range = computePriceRange(variants, procedureCore);
    const procedure: Procedure = {
      ...procedureCore,
      priceMin: range.priceMin,
      priceMax: range.priceMax,
    };

    addProcedure(procedure, variants);
    return NextResponse.json({ ok: true, procedure, variants });
  } catch {
    return NextResponse.json({ error: 'Failed to create procedure' }, { status: 500 });
  }
}

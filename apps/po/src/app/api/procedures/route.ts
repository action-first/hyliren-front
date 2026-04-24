import { NextRequest, NextResponse } from 'next/server';
import {
  getProcedures, addProcedure,
} from '@hyliren/shared/src/server/data-store';
import { computePriceRange } from '@hyliren/shared/src/types/procedure';
import type {
  Procedure, ProcedureDetail, ProcedureVariant,
} from '@hyliren/shared';
import type { ProcedureStatus } from '@hyliren/shared/src/constants';
import { createProcedureSchema, generateSlug } from './schema';

/**
 * GET /api/procedures?memberId=...&status=...
 * PO 는 자신의 시술 목록을 모든 상태에서 조회.
 */
export async function GET(req: NextRequest) {
  try {
    const memberId = req.nextUrl.searchParams.get('memberId');
    const status = req.nextUrl.searchParams.get('status') as ProcedureStatus | null;
    if (!memberId) {
      return NextResponse.json({ error: 'memberId 필수' }, { status: 400 });
    }
    let procedures = getProcedures().filter(p => p.memberId === memberId && !p.deletedAt);
    if (status) procedures = procedures.filter(p => p.status === status);
    procedures.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    return NextResponse.json({ procedures, total: procedures.length });
  } catch {
    return NextResponse.json({ error: 'Failed to load procedures' }, { status: 500 });
  }
}

/**
 * POST /api/procedures
 * 4-step wizard 전체 완료 후 일괄 생성. Procedure + Detail + Variants 동시 저장.
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

    // Detail 먼저 구성 (priceRange 계산에 필요)
    const detail: ProcedureDetail = {
      procedureId,
      description: data.description,
      descriptionZh: data.descriptionZh,
      indications: data.indications,
      precautions: data.precautions,
      precautionsZh: data.precautionsZh,
      galleryImageUrls: data.galleryImageUrls,
      basePrice: data.basePrice,
      baseAnesthesia: data.baseAnesthesia,
      baseDurationMinutes: data.baseDurationMinutes,
      baseRecoveryDays: data.baseRecoveryDays,
      baseHospitalStayDays: data.baseHospitalStayDays,
      updatedAt: now,
    };

    const variants: ProcedureVariant[] = data.variants.map((v, i) => ({
      id: `pv-${Date.now()}-${i}`,
      procedureId,
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
    }));

    const { priceMin, priceMax } = computePriceRange(variants, detail);

    const procedure: Procedure = {
      id: procedureId,
      memberId: data.memberId,
      slug,
      title: data.title,
      titleZh: data.titleZh,
      primaryArea: data.primaryArea,
      procedureType: data.procedureType,
      heroImageUrl: data.heroImageUrl || '',
      priceMin,
      priceMax,
      currency: 'KRW',
      status: data.status,
      publishedAt: data.status === 'published' ? now : null,
      viewCount: 0,
      bookmarkCount: 0,
      consultClickCount: 0,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    };

    addProcedure(procedure, detail, variants);

    return NextResponse.json({ ok: true, procedure, detail, variants });
  } catch {
    return NextResponse.json({ error: 'Failed to create procedure' }, { status: 500 });
  }
}

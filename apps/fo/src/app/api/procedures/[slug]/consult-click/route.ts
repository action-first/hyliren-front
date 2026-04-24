import { NextRequest, NextResponse } from 'next/server';
import {
  getProcedureBySlug, incrementProcedureMetric,
} from '@hyliren/shared/src/server/data-store';

/**
 * POST /api/procedures/[slug]/consult-click
 * FO 상세페이지 하단 CTA 클릭 시 호출. consultClickCount++.
 */
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const procedure = getProcedureBySlug(slug);
  if (!procedure) {
    return NextResponse.json({ error: '시술을 찾을 수 없습니다' }, { status: 404 });
  }
  incrementProcedureMetric(procedure.id, 'consultClickCount');
  return NextResponse.json({ ok: true, procedureId: procedure.id });
}

import { NextRequest, NextResponse } from 'next/server';
import {
  getProcedureBySlug, getProcedureDetail, getProcedureVariants,
  incrementProcedureMetric, isProcedureBookmarked,
} from '@hyliren/shared/src/server/data-store';

/**
 * GET /api/procedures/[slug]
 * 시술 상세 (procedure + detail + variants). 호출 시 viewCount++.
 *
 * Query:
 *  - userId: string (선택, 북마크 여부 반환)
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const procedure = getProcedureBySlug(slug);
  if (!procedure || procedure.status !== 'published') {
    return NextResponse.json({ error: '시술을 찾을 수 없습니다' }, { status: 404 });
  }

  const detail = getProcedureDetail(procedure.id);
  const variants = getProcedureVariants(procedure.id);
  if (!detail) {
    return NextResponse.json({ error: '상세 정보가 없습니다' }, { status: 500 });
  }

  incrementProcedureMetric(procedure.id, 'viewCount');

  const userId = req.nextUrl.searchParams.get('userId');
  const isBookmarked = userId ? isProcedureBookmarked(userId, procedure.id) : false;

  return NextResponse.json({ procedure, detail, variants, isBookmarked });
}

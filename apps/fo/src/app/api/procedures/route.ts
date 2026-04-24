import { NextRequest, NextResponse } from 'next/server';
import { getProcedures } from '@hyliren/shared/src/server/data-store';
import { pickI18n, resolveRequestLocale } from '@hyliren/shared/src/domain/procedure';
import type { Procedure } from '@hyliren/shared';
import type { BodyArea, ProcedureType } from '@hyliren/shared/src/constants';

/**
 * GET /api/procedures
 * FO 시술 카탈로그. published 만 노출. 서버가 locale merge + fallback 완료한 flat object 반환.
 *
 * Query:
 *  - locale: Locale (선택, 없으면 Accept-Language → 'ko')
 *  - primaryArea: BodyArea (선택)
 *  - procedureType: ProcedureType (선택)
 *  - memberId: string (선택)
 *  - sort: 'latest' | 'price_asc' | 'price_desc' | 'popular' (기본 'latest')
 *  - limit: number (기본 20, 최대 100)
 */
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const locale = resolveRequestLocale(
    searchParams.get('locale'),
    req.headers.get('accept-language'),
  );
  const primaryArea = searchParams.get('primaryArea') as BodyArea | null;
  const procedureType = searchParams.get('procedureType') as ProcedureType | null;
  const memberId = searchParams.get('memberId');
  const sort = searchParams.get('sort') ?? 'latest';
  const limit = Math.min(100, Number(searchParams.get('limit')) || 20);

  let procedures = getProcedures().filter(p => p.status === 'published');

  if (primaryArea) procedures = procedures.filter(p => p.primaryArea === primaryArea);
  if (procedureType) procedures = procedures.filter(p => p.procedureType === procedureType);
  if (memberId) procedures = procedures.filter(p => p.memberId === memberId);

  switch (sort) {
    case 'price_asc':
      procedures.sort((a, b) => a.priceMin - b.priceMin);
      break;
    case 'price_desc':
      procedures.sort((a, b) => b.priceMin - a.priceMin);
      break;
    case 'popular':
      procedures.sort((a, b) => b.viewCount + b.bookmarkCount - (a.viewCount + a.bookmarkCount));
      break;
    case 'latest':
    default:
      procedures.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  const total = procedures.length;
  const merged = procedures.slice(0, limit).map(p => mergeForCard(p, locale));
  return NextResponse.json({ locale, procedures: merged, total });
}

/** 카드용 flat object — title 만 merge (description 등은 상세에서만 필요). */
function mergeForCard(procedure: Procedure, locale: string) {
  const pick = pickI18n(procedure.i18n, locale as never, procedure.sourceLocale);
  return {
    ...procedure,
    locale,
    fallback: pick?.fallback ?? true,
    title: pick?.content.title ?? '',
    // 카드에서는 description/precautions/indications 노출 안 함 → 생략
    // i18n 원본은 숨겨서 페이로드 사이즈 감소
    i18n: undefined,
  };
}

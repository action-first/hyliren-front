import { NextRequest, NextResponse } from 'next/server';
import {
  getProcedureBySlug, getProcedureVariants,
  incrementProcedureMetric, isProcedureBookmarked,
} from '@hyliren/shared/src/server/data-store';
import {
  pickI18n, getEffectiveVariant, resolveRequestLocale,
} from '@hyliren/shared/src/domain/procedure';

/**
 * GET /api/procedures/[slug]
 * 시술 상세 — procedure + variants 를 locale merge + effective 값까지 계산해서 flat 반환.
 *
 * Query:
 *  - locale (선택, 없으면 Accept-Language → 'ko')
 *  - userId (선택, 북마크 여부 반환)
 *
 * Side effect: viewCount++
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const locale = resolveRequestLocale(
    req.nextUrl.searchParams.get('locale'),
    req.headers.get('accept-language'),
  );
  const procedure = getProcedureBySlug(slug);
  if (!procedure || procedure.status !== 'published') {
    return NextResponse.json({ error: '시술을 찾을 수 없습니다' }, { status: 404 });
  }

  const variants = getProcedureVariants(procedure.id);
  incrementProcedureMetric(procedure.id, 'viewCount');

  const userId = req.nextUrl.searchParams.get('userId');
  const isBookmarked = userId ? isProcedureBookmarked(userId, procedure.id) : false;

  /* Procedure-level content merge */
  const procPick = pickI18n(procedure.i18n, locale, procedure.sourceLocale);

  /* Variant-level content + effective 값 merge */
  const mergedVariants = variants.map(v => {
    const eff = getEffectiveVariant(v, procedure);
    const vPick = pickI18n(v.i18n, locale, procedure.sourceLocale);
    return {
      id: v.id,
      procedureId: v.procedureId,
      sortOrder: v.sortOrder,
      isDefault: v.isDefault,
      createdAt: v.createdAt,
      updatedAt: v.updatedAt,
      // effective 값 (override 없으면 base 승계)
      price: eff.price,
      anesthesia: eff.anesthesia,
      durationMinutes: eff.durationMinutes,
      recoveryDays: eff.recoveryDays,
      hospitalStayDays: eff.hospitalStayDays,
      // locale 텍스트
      name: vPick?.content.name ?? '',
      description: vPick?.content.description ?? null,
      fallback: vPick?.fallback ?? true,
    };
  });

  return NextResponse.json({
    locale,
    fallback: procPick?.fallback ?? true,
    isBookmarked,
    procedure: {
      id: procedure.id,
      memberId: procedure.memberId,
      slug: procedure.slug,
      primaryArea: procedure.primaryArea,
      procedureType: procedure.procedureType,
      heroImageUrl: procedure.heroImageUrl,
      galleryImageUrls: procedure.galleryImageUrls,
      priceMin: procedure.priceMin,
      priceMax: procedure.priceMax,
      currency: procedure.currency,
      status: procedure.status,
      viewCount: procedure.viewCount,
      bookmarkCount: procedure.bookmarkCount,
      consultClickCount: procedure.consultClickCount,
      publishedAt: procedure.publishedAt,
      createdAt: procedure.createdAt,
      updatedAt: procedure.updatedAt,
      // locale 텍스트 (merged)
      title: procPick?.content.title ?? '',
      description: procPick?.content.description ?? '',
      precautions: procPick?.content.precautions ?? '',
      indications: procPick?.content.indications ?? [],
    },
    variants: mergedVariants,
  });
}

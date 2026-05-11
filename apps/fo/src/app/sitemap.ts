import type { MetadataRoute } from 'next';
import { LOCALES } from '@hyliren/shared';
import { env } from '@/lib/env';
import { fetchAllArticleSlugsServer } from '@/lib/api/article/server';

/**
 * sitemap.xml — 정적 라우트 + dynamic articles × 4 lang 노출.
 *
 * Google/네이버/바이두 등 검색엔진이 모든 lang 페이지를 인덱싱하도록 path 별 entry 와
 * `alternates.languages` (hreflang) 동시 노출.
 *
 * Dynamic:
 *   - articles: BE `/api/v1/articles?limit=200` 응답 slug 목록 × 4 lang.
 *     BE 응답 실패 시 정적 path 만 노출 (graceful fail — sitemap 자체는 살아있음).
 *
 * 미포함:
 *   - `/concerns/[id]`, `/mypage/reports/[proposalId]` 등 인증 필요 path (robots disallow)
 *   - `/procedures/[slug]` — 시술 카탈로그 정책 미정 (사용자 결정 후 추가)
 *
 * Force-dynamic 사유:
 *   Vercel build 시점에 BE 가 cold start / 또는 env 미등록 fallback 으로 인해 빈 array 가
 *   사이트맵에 cache 되는 결함을 차단. 매 sitemap.xml 요청마다 BE 에 fresh fetch (BE 응답
 *   자체는 fetchAllArticleSlugsServer 의 fetch options 에서 no-store).
 *   sitemap 접근은 검색엔진 크롤러만 가끔 호출 → 비용 영향 미미.
 */
export const dynamic = 'force-dynamic';

const STATIC_PATHS = [
  '',
  '/articles',
  '/consult',
  '/dashboard',
  '/decision',
  '/mypage',
  '/mypage/reports',
  '/proposals',
  // 법무 페이지 — 검색엔진 인덱싱 + GSC 인증 시점에 검출 가능하도록 sitemap 노출
  '/privacy',
  '/terms',
  '/medical-disclaimer',
] as const;

function buildEntry(
  locale: string,
  path: string,
  lastMod: Date,
  priority: number,
): MetadataRoute.Sitemap[number] {
  return {
    url: `${env.siteUrl}/${locale}${path}`,
    lastModified: lastMod,
    alternates: {
      languages: Object.fromEntries(
        LOCALES.map((l) => [l, `${env.siteUrl}/${l}${path}`]),
      ),
    },
    priority,
    changeFrequency: 'weekly',
  };
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const lastMod = new Date();

  const staticEntries = STATIC_PATHS.flatMap((path) =>
    LOCALES.map((locale) => buildEntry(locale, path, lastMod, path === '' ? 1.0 : 0.7)),
  );

  // articles dynamic — SEO 핵심 콘텐츠라 priority 0.8 (홈 < article < 정적 페이지)
  const slugs = await fetchAllArticleSlugsServer();
  const articleEntries = slugs.flatMap((slug) =>
    LOCALES.map((locale) => buildEntry(locale, `/articles/${slug}`, lastMod, 0.8)),
  );

  return [...staticEntries, ...articleEntries];
}

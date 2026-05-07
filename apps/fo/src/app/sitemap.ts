import type { MetadataRoute } from 'next';
import { LOCALES } from '@hyliren/shared';
import { env } from '@/lib/env';

/**
 * sitemap.xml — 정적 라우트 × 4 lang 노출.
 *
 * Google/네이버 등 검색엔진이 4 개 lang 페이지를 모두 인덱싱하도록 path 별 entry 와
 * `alternates.languages` (hreflang) 동시 노출.
 *
 * 동적 path (`/concerns/[id]`, `/articles/[slug]`, `/procedures/[slug]`,
 * `/mypage/reports/[proposalId]`) 는 인증 필요 / 시술 카탈로그 BE 미정 등 후속 PR 분리.
 */

const STATIC_PATHS = [
  '',
  '/articles',
  '/consult',
  '/dashboard',
  '/decision',
  '/mypage',
  '/mypage/reports',
  '/proposals',
] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  const lastMod = new Date();

  return STATIC_PATHS.flatMap((path) =>
    LOCALES.map((locale) => {
      const url = `${env.siteUrl}/${locale}${path}`;
      return {
        url,
        lastModified: lastMod,
        // 모든 lang URL 을 alternates.languages 로 노출 → hreflang 정합
        alternates: {
          languages: Object.fromEntries(
            LOCALES.map((l) => [l, `${env.siteUrl}/${l}${path}`]),
          ),
        },
        // 홈은 priority 1.0, 그 외는 0.7 (Next.js 기본은 0.5 / 검색 노출 우선순위 신호용)
        priority: path === '' ? 1.0 : 0.7,
        changeFrequency: 'weekly' as const,
      };
    }),
  );
}

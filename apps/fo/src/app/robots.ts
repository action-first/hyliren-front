import type { MetadataRoute } from 'next';
import { env } from '@/lib/env';

/**
 * robots.txt — 검색엔진 크롤러용.
 *
 * mypage / dashboard 등 인증 페이지는 disallow (콘텐츠 보호).
 * sitemap 위치를 명시하여 검색엔진이 자동 발견.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/*/mypage', '/*/dashboard', '/*/proposals'],
      },
    ],
    sitemap: `${env.siteUrl}/sitemap.xml`,
    host: env.siteUrl,
  };
}

/**
 * 검색엔진 메타(canonical, hreflang, og)·sitemap 에서 사용하는 절대 URL base.
 * production: `https://mi-myo.com` 고정. preview/local 도 동일 fallback (상대 path 노출 회피).
 */
const DEFAULT_SITE_URL = 'https://mi-myo.com';

export const env = {
  customerApiBaseUrl: process.env.NEXT_PUBLIC_CUSTOMER_API_BASE_URL ?? 'http://localhost:3001/customer',
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? DEFAULT_SITE_URL,
} as const;

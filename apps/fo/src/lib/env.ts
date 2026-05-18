/**
 * 검색엔진 메타(canonical, hreflang, og)·sitemap 에서 사용하는 절대 URL base.
 * production: `https://mi-myo.com` 고정. preview/local 도 동일 fallback (상대 path 노출 회피).
 */
const DEFAULT_SITE_URL = 'https://mi-myo.com';

/**
 * 검색엔진 owner verification 토큰.
 *
 * - 등록 흐름: GSC / 네이버 웹마스터 / 바이두 zhanzhang 에서 사이트 추가 → meta tag 방식 선택
 *   → 받은 content 값을 Vercel project env 에 설정 → 자동 deploy → search console 에서
 *   "Verify" 클릭.
 * - 비어있으면 meta tag 미노출 (search console 인증 안 됨). 즉 토큰 부재 = no-op.
 * - public 노출 가능한 값 (verification 자체가 공개 정보) 이므로 NEXT_PUBLIC_ prefix.
 */
const verification = {
  google: process.env.NEXT_PUBLIC_GSC_VERIFICATION || undefined,
  naver: process.env.NEXT_PUBLIC_NAVER_VERIFICATION || undefined,
  baidu: process.env.NEXT_PUBLIC_BAIDU_VERIFICATION || undefined,
} as const;

/**
 * Google Analytics 4 Measurement ID — Vercel project env `NEXT_PUBLIC_GA_MEASUREMENT_ID`.
 * 형식: `G-XXXXXXXXXX`. 미설정 시 GA script 미주입 (no-op).
 */
const gaMeasurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || undefined;

export const env = {
  customerApiBaseUrl: process.env.NEXT_PUBLIC_CUSTOMER_API_BASE_URL ?? 'http://localhost:3001/customer',
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? DEFAULT_SITE_URL,
  verification,
  gaMeasurementId,
} as const;

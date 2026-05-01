import { cookies, headers } from 'next/headers';
import { narrowLocale, parseAcceptLanguage, type Locale } from '@hyliren/shared';

export const LOCALE_COOKIE_NAME = 'mimyo-locale';

/**
 * SSR 단계에서 현재 locale 결정 — RootLayout/generateMetadata 등 server component 전용.
 *
 * 우선순위:
 *   1. cookie `mimyo-locale` (FE 의 useLocaleStore.setLocale 이 동기화)
 *   2. `Accept-Language` 헤더 — q-value 우선순위로 정렬된 다단 매칭
 *      (BE 공통 resolver 와 동일한 RFC 7231 §5.3.5 부분 구현)
 *      예: `fr-FR, ja;q=0.9, en;q=0.8` → ja 매칭
 *   3. fallback `'zh-CN'` (Customer 앱 주 사용자)
 *
 * Why cookie:
 *   localStorage 는 client-only 라 SSR 첫 렌더에서 못 읽음 — html lang/metadata 가
 *   초기엔 fallback 으로 깨지는 결함. cookie 로 SSR-readable 한 locale 전달.
 */
export async function getServerLocale(): Promise<Locale> {
  const cookieStore = await cookies();
  const fromCookie = cookieStore.get(LOCALE_COOKIE_NAME)?.value;
  if (fromCookie) {
    return narrowLocale(fromCookie, 'zh-CN');
  }

  const headerStore = await headers();
  const accept = headerStore.get('accept-language');
  if (accept) {
    const parsed = parseAcceptLanguage(accept);
    if (parsed) return parsed;
  }

  return 'zh-CN';
}

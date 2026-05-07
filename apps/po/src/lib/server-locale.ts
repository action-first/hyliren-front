import { cookies, headers } from 'next/headers';
import { narrowLocale, parseAcceptLanguage, type Locale } from '@hyliren/shared';

export const LOCALE_COOKIE_NAME = 'mimyo-po-locale';

/**
 * SSR 단계에서 현재 locale 결정 — Partner 앱 RootLayout/generateMetadata 전용.
 *
 * 우선순위:
 *   1. cookie `mimyo-po-locale` (FE 의 useLocaleStore.setLocale 이 동기화)
 *   2. `Accept-Language` 헤더 — q-value 우선순위 다단 매칭 (BE 공통 resolver 와 동일)
 *      예: `fr-FR, ja;q=0.9, en;q=0.8` → ja
 *   3. fallback `'ko'` (Partner 앱 주 사용자 = 한국 병원)
 */
export async function getServerLocale(): Promise<Locale> {
  const cookieStore = await cookies();
  const fromCookie = cookieStore.get(LOCALE_COOKIE_NAME)?.value;
  if (fromCookie) {
    return narrowLocale(fromCookie, 'ko');
  }

  const headerStore = await headers();
  const accept = headerStore.get('accept-language');
  if (accept) {
    const parsed = parseAcceptLanguage(accept);
    if (parsed) return parsed;
  }

  return 'ko';
}

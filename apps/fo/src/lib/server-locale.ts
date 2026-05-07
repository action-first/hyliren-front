import { cookies } from 'next/headers';
import { isLocale, type Locale } from '@hyliren/shared';

/**
 * Server-side locale 헬퍼.
 *
 * locale 결정의 SSOT 는 middleware 가 강제하는 `[lang]` path segment.
 * 따라서 server component / page 는 `params.lang` 을 직접 받아 사용한다 (Next 15 표준).
 *
 * 본 모듈은 root layout / params 를 받지 못하는 server context 전용 폴백:
 *   middleware 가 동기화한 cookie `mimyo-locale` 을 읽어 lang 결정.
 */

const FALLBACK_LOCALE: Locale = 'zh-CN';
export const LOCALE_COOKIE_NAME = 'mimyo-locale';

/**
 * cookie 에서 locale 읽기 (root layout 등 params 미수신 context 용).
 * middleware 가 모든 진입에서 cookie 를 path lang 과 동기화하므로 정합 보장.
 */
export async function getLocaleFromCookie(): Promise<Locale> {
  const c = (await cookies()).get(LOCALE_COOKIE_NAME)?.value;
  return c && isLocale(c) ? c : FALLBACK_LOCALE;
}

/** params.lang 을 안전하게 Locale 로 좁힘. 잘못된 값이면 fallback. */
export function narrowLangParam(value: unknown): Locale {
  return typeof value === 'string' && isLocale(value) ? value : FALLBACK_LOCALE;
}

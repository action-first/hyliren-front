'use client';

import { create } from 'zustand';
import { type Locale } from '@hyliren/shared';
import { t as translate } from '@hyliren/i18n';

/**
 * Locale store — path SSOT (FO i18n routing) 기반.
 *
 * 결정 흐름:
 *   middleware (path/cookie/Accept-Language) → `[lang]` segment → LocaleSync → store
 *
 * Why no persist:
 *   path 가 SSOT 이므로 localStorage persist 는 불필요·위험. 이전 결함의 원인이었던
 *   "default fallback 으로 hydrate → cookie 자동 박제" 문제도 path 기반으로 자연 해소됨.
 *
 * Why new t reference on setLocale:
 *   zustand selector (s => s.t) 는 reference equality 로 변경 감지 — locale 변경 시 t 도
 *   새 reference 로 갱신해야 모든 컴포넌트가 새 번역으로 재렌더된다.
 */

const FALLBACK_LOCALE: Locale = 'zh-CN';

function makeT(locale: Locale) {
  return (key: string, params?: Record<string, string | number>) =>
    translate(locale, key, params);
}

interface LocaleState {
  locale: Locale;
  /**
   * locale 변경. LocaleSync 가 path 기반으로 호출하거나, 사용자 명시 선택(드롭다운)이
   * router.push(`/${newLang}${rest}`) 후 후속으로 호출한다.
   */
  setLocale: (locale: Locale) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}

export const useLocaleStore = create<LocaleState>()((set) => ({
  locale: FALLBACK_LOCALE,
  setLocale: (locale) => set({ locale, t: makeT(locale) }),
  t: makeT(FALLBACK_LOCALE),
}));

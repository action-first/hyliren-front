'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { isLocale, type Locale } from '@hyliren/shared';
import { t as translate } from '@hyliren/i18n';

interface LocaleState {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}

function makeT(locale: Locale) {
  return (key: string, params?: Record<string, string | number>) =>
    translate(locale, key, params);
}

const LOCALE_COOKIE_NAME = 'mimyo-locale';
const LOCALE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1년
/** FO Customer 앱 fallback (i18n-strategy §8-1). */
const FALLBACK_LOCALE: Locale = 'zh-CN';

/**
 * SSR (RootLayout `<html lang>`, generateMetadata) 가 cookie 로 locale 을 읽기 위한 동기화.
 * client-only 환경에서만 동작 — useLocaleStore.setLocale 호출 시·persist rehydrate 후 호출.
 */
function syncLocaleCookie(locale: Locale) {
  if (typeof document === 'undefined') return;
  const secure = window.location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = `${LOCALE_COOKIE_NAME}=${locale}; Path=/; Max-Age=${LOCALE_COOKIE_MAX_AGE}; SameSite=Lax${secure}`;
}

/**
 * cookie 에서 locale 읽기 — SSR-CSR 단일 진실원천.
 *
 * 우선순위 (rehydrate 시점):
 *   1. cookie `mimyo-locale` (SSR 가 결정한 값 — Accept-Language 첫 진입 시 동기화 미설정)
 *   2. zustand persist localStorage (이전 setLocale 결과)
 *   3. FALLBACK_LOCALE
 */
function readLocaleCookie(): Locale | null {
  if (typeof document === 'undefined') return null;
  const m = /(?:^|;\s*)mimyo-locale=([^;]+)/.exec(document.cookie);
  if (!m) return null;
  const v = decodeURIComponent(m[1]);
  return isLocale(v) ? v : null;
}

/**
 * locale store — 번역 함수 t 를 locale 변경 시 새 reference 로 갱신.
 *
 * Why new reference on every setLocale:
 *   zustand selector (s => s.t) 는 reference equality 로 변경 감지함.
 *   t 가 항상 같은 reference 면 locale 이 바뀌어도 컴포넌트 재렌더가 트리거되지 않음
 *   → 화면 텍스트가 이전 locale 로 그대로 남는 결함 (Codex QA Critical 발견사항).
 *
 * Why onRehydrateStorage:
 *   persist 는 localStorage 에서 locale 만 복원하므로, hydration 후 store 의 t 는
 *   여전히 초기값('ko' 기준) 으로 남음. rehydrate 시점에 t 도 복원된 locale 기준으로
 *   재생성해야 새로고침 직후에도 올바른 번역이 노출됨.
 */
export const useLocaleStore = create<LocaleState>()(
  persist(
    (set) => ({
      locale: FALLBACK_LOCALE,
      setLocale: (locale) => {
        set({ locale, t: makeT(locale) });
        syncLocaleCookie(locale);
      },
      t: makeT(FALLBACK_LOCALE),
    }),
    {
      name: 'hyliren-locale',
      partialize: (state) => ({ locale: state.locale }),
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        // Cookie 우선 — SSR getServerLocale 이 결정한 값이 SSOT. localStorage 와 다르면 cookie 값 채택.
        const fromCookie = readLocaleCookie();
        if (fromCookie && fromCookie !== state.locale) {
          state.locale = fromCookie;
        }
        state.t = makeT(state.locale);
        // 새로고침 후에도 cookie 가 SSR 과 정합되도록 재동기화 (cookie 미존재 사용자에게 채워둠).
        syncLocaleCookie(state.locale);
      },
    },
  ),
);

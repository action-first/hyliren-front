'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Locale } from '@hyliren/shared';
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

const LOCALE_COOKIE_NAME = 'mimyo-po-locale';
const LOCALE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1년

/**
 * SSR (RootLayout `<html lang>`, generateMetadata) 가 cookie 로 locale 을 읽기 위한 동기화.
 */
function syncLocaleCookie(locale: Locale) {
  if (typeof document === 'undefined') return;
  const secure = window.location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = `${LOCALE_COOKIE_NAME}=${locale}; Path=/; Max-Age=${LOCALE_COOKIE_MAX_AGE}; SameSite=Lax${secure}`;
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
      locale: 'ko',
      setLocale: (locale) => {
        set({ locale, t: makeT(locale) });
        syncLocaleCookie(locale);
      },
      t: makeT('ko'),
    }),
    {
      name: 'po-locale',
      partialize: (state) => ({ locale: state.locale }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.t = makeT(state.locale);
          syncLocaleCookie(state.locale);
        }
      },
    },
  ),
);

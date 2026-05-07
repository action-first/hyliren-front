'use client';

import { createContext, useContext, useEffect, useRef, type ReactNode } from 'react';
import { createStore, useStore } from 'zustand';
import type { StoreApi } from 'zustand';
import { type Locale } from '@hyliren/shared';
import { t as translate } from '@hyliren/i18n';

/**
 * Locale store — path SSOT (FO i18n routing) 기반 Context Provider.
 *
 * Why Provider over module singleton:
 *   기존 `create()` singleton 은 SSR 시점에 default locale ('zh-CN') 로 고정 초기화 →
 *   `'use client'` 컴포넌트(FOHeader 등) 가 SSR HTML 에 zh-CN 텍스트로 렌더 → hydration 후
 *   LocaleSync 가 path lang 으로 setLocale → 사용자가 짧은 깜빡임 경험.
 *
 *   Provider 가 [lang] layout 의 `params.lang` 을 initial state 로 주입하여 SSR 첫 paint
 *   부터 정합 보장. CSR navigation(`/ko → /ja`) 시 useEffect 로 store 갱신.
 */

interface LocaleState {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}

type LocaleStore = StoreApi<LocaleState>;

function makeT(locale: Locale) {
  return (key: string, params?: Record<string, string | number>) =>
    translate(locale, key, params);
}

function buildStore(initialLocale: Locale): LocaleStore {
  return createStore<LocaleState>((set) => ({
    locale: initialLocale,
    setLocale: (locale) => set({ locale, t: makeT(locale) }),
    t: makeT(initialLocale),
  }));
}

const LocaleStoreContext = createContext<LocaleStore | null>(null);

export function LocaleStoreProvider({
  initialLocale,
  children,
}: {
  initialLocale: Locale;
  children: ReactNode;
}) {
  const storeRef = useRef<LocaleStore | null>(null);
  if (!storeRef.current) {
    storeRef.current = buildStore(initialLocale);
  }

  // SPA navigation (예: /ko → /ja) 으로 [lang] segment 가 변하면 layout instance 는 유지되지만
  // initialLocale prop 만 갱신됨 — 그때 store 도 새 lang 으로 동기화.
  useEffect(() => {
    const store = storeRef.current;
    if (!store) return;
    if (store.getState().locale !== initialLocale) {
      store.setState({ locale: initialLocale, t: makeT(initialLocale) });
    }
  }, [initialLocale]);

  return (
    <LocaleStoreContext.Provider value={storeRef.current}>
      {children}
    </LocaleStoreContext.Provider>
  );
}

/**
 * Locale store hook. selector 또는 미지정.
 *
 *   useLocaleStore(s => s.t)        → t 함수만 구독 (re-render 최소화)
 *   useLocaleStore(s => s.locale)   → locale 만 구독
 *   useLocaleStore()                → 전체 state (selector 권장)
 *
 * Provider 가 없으면 throw — `[lang]` layout 밖에서 호출되는 케이스 차단.
 */
export function useLocaleStore(): LocaleState;
export function useLocaleStore<T>(selector: (state: LocaleState) => T): T;
export function useLocaleStore<T>(
  selector?: (state: LocaleState) => T,
): T | LocaleState {
  const store = useContext(LocaleStoreContext);
  if (!store) {
    throw new Error(
      'useLocaleStore must be used within <LocaleStoreProvider>. Check that the component is rendered inside the [lang] layout tree.',
    );
  }
  return selector ? useStore(store, selector) : useStore(store);
}

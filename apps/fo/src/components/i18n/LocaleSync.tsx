'use client';

import { useEffect } from 'react';
import type { Locale } from '@hyliren/shared';
import { useLocaleStore } from '@/store/locale';

/**
 * `[lang]` segment 의 lang 을 client zustand store 로 동기화.
 *
 * path 가 SSOT 이므로 client store 의 locale 은 항상 path 기준으로 갱신된다.
 * 사용자가 `/ko/...` → `/ja/...` 처럼 path navigation 으로 locale 을 바꾸면
 * 이 컴포넌트가 useEffect 로 새 lang 을 store 에 set → 모든 t() 호출이 즉시 갱신.
 */
export function LocaleSync({ locale }: { locale: Locale }) {
  useEffect(() => {
    const current = useLocaleStore.getState().locale;
    if (current !== locale) {
      useLocaleStore.getState().setLocale(locale);
    }
  }, [locale]);
  return null;
}

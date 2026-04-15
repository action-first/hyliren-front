import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Locale } from '@hyliren/shared';
import { t as translate } from '@hyliren/i18n';

interface LocaleState {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}

export const useLocaleStore = create<LocaleState>()(
  persist(
    (set, get) => ({
      locale: 'ko',
      setLocale: (locale) => set({ locale }),
      t: (key, params) => translate(get().locale, key, params),
    }),
    {
      name: 'hyliren-locale',
      partialize: (state) => ({ locale: state.locale }),
    },
  ),
);

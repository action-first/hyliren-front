'use client';

import { useRouter, useParams } from 'next/navigation';
import { useMemo } from 'react';
import { isLocale, type Locale } from '@hyliren/shared';

const FALLBACK_LOCALE: Locale = 'zh-CN';

/**
 * locale-aware router wrapper — `useRouter()` drop-in 대체.
 *
 * push / replace 시 path 기반 href 에 현재 `[lang]` segment 자동 prefix.
 * 사용:
 *   const router = useLocalizedRouter();
 *   router.push('/concerns/123');   // → /ko/concerns/123
 */
export function useLocalizedRouter() {
  const router = useRouter();
  const params = useParams();
  const langParam = params?.lang;
  const lang =
    typeof langParam === 'string' && isLocale(langParam) ? langParam : FALLBACK_LOCALE;

  return useMemo(
    () => ({
      push: (href: string) => router.push(localizePath(href, lang)),
      replace: (href: string) => router.replace(localizePath(href, lang)),
      back: () => router.back(),
      forward: () => router.forward(),
      refresh: () => router.refresh(),
      prefetch: (href: string) => router.prefetch(localizePath(href, lang)),
    }),
    [router, lang],
  );
}

function localizePath(href: string, lang: Locale): string {
  if (!href.startsWith('/')) return href; // 외부 URL · hash 등
  const segments = href.split('/').filter(Boolean);
  const first = segments[0];
  if (first && isLocale(first)) return href;
  return href === '/' ? `/${lang}` : `/${lang}${href}`;
}

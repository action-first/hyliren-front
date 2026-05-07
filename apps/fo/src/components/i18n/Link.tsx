'use client';

import NextLink from 'next/link';
import { useParams } from 'next/navigation';
import type { ComponentProps } from 'react';
import { isLocale, type Locale } from '@hyliren/shared';

const FALLBACK_LOCALE: Locale = 'zh-CN';

/**
 * locale-aware Link wrapper.
 *
 * `next/link` 의 drop-in 대체. 모든 내부 path(`'/'` 로 시작) 에 현재 `[lang]` segment 를
 * 자동 prefix 하여 SPA navigation 시점에도 lang 일관성 유지.
 *
 * 외부 URL(`'http(s)://'`), `'#'`, `'mailto:'` 등은 그대로 통과.
 *
 * 사용:
 *   import { Link } from '@/components/i18n/Link';
 *   <Link href="/concerns/123">...</Link>   // → /ko/concerns/123 (ko 페이지에서)
 */
export function Link({ href, ...rest }: ComponentProps<typeof NextLink>) {
  const params = useParams();
  const langParam = params?.lang;
  const lang =
    typeof langParam === 'string' && isLocale(langParam) ? langParam : FALLBACK_LOCALE;

  const localizedHref = localizeHref(href, lang);
  return <NextLink href={localizedHref} {...rest} />;
}

/**
 * href 를 path 기반으로 localize.
 * - string `'/...'` → `'/{lang}/...'` (root `'/'` → `'/{lang}'`)
 * - 이미 `/ko/`, `/zh-CN/`, `/ja/`, `/en/` 으로 시작하면 그대로
 * - 외부 URL · hash · mailto: · tel: → 그대로
 * - URL 객체 → 그대로 (호출처에서 직접 lang 박아 쓰는 케이스)
 */
function localizeHref(href: ComponentProps<typeof NextLink>['href'], lang: Locale) {
  if (typeof href !== 'string') return href;
  if (!href.startsWith('/')) return href;

  const segments = href.split('/').filter(Boolean);
  const first = segments[0];
  if (first && isLocale(first)) return href; // 이미 lang prefix 있음

  return href === '/' ? `/${lang}` : `/${lang}${href}`;
}

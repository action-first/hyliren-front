'use client';

import { useEffect } from 'react';
import type { Locale } from '@hyliren/shared';
import { useLocaleStore } from '@/store/locale';

/**
 * SSR `getServerLocale()` 결정값을 client zustand store 에 1회 주입.
 *
 * Why this exists:
 *   RSC 는 cookie 를 set 할 수 없어, 첫 진입(cookie 없음 + Accept-Language `ko`)에선
 *   SSR 이 'ko' 로 렌더해도 client persist 가 default 'zh-CN' 으로 hydrate 하여
 *   화면이 'zh-CN' 으로 덮인다 (그리고 cookie 도 'zh-CN' 으로 박제됨).
 *   이 컴포넌트가 SSR 결정값을 store 로 끌어올려 다리 역할을 한다.
 *
 * 우선순위 (store.hydrateFromServer 내부):
 *   1. cookie 존재 → 사용자 명시 선택 존중하여 no-op
 *   2. cookie 없음 → SSR locale 로 store + cookie 동기화
 */
export function LocaleHydrator({ initialLocale }: { initialLocale: Locale }) {
  useEffect(() => {
    useLocaleStore.getState().hydrateFromServer(initialLocale);
  }, [initialLocale]);

  return null;
}

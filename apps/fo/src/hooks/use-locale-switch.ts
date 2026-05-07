'use client';

import { usePathname } from 'next/navigation';
import type { Locale } from '@hyliren/shared';
import { useAuthStore } from '@/store/auth';
import { updateLocale as updateLocaleApi } from '@/lib/api/auth';

/**
 * 사용자 명시 언어 선택 (마이페이지 / LanguageSwitcher 등에서 호출).
 *
 * 동작:
 *   1. 현재 pathname 의 lang prefix 를 새 lang 으로 교체하여 full navigation
 *      (window.location.assign — layout 재마운트로 LocaleStoreProvider initialLocale
 *       이 새 lang 으로 SSR 정합. router.replace 는 RSC 만 갱신해 SSR 텍스트가
 *       옛 lang 으로 남는 케이스 회피)
 *   2. middleware 가 새 path 진입 시 cookie 자동 동기화
 *   3. 로그인 사용자: PATCH /auth/locale fire-and-forget (디바이스 간 일관성)
 *
 * cookie 박제 결함 회피:
 *   path navigation 자체가 SSOT 변경이라 store/cookie 직접 set 안 함.
 */
export function useLocaleSwitch() {
  const pathname = usePathname() ?? '/';
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn);

  return (next: Locale) => {
    const stripped = pathname.replace(/^\/[a-z-]+(\/|$)/, '/');
    const newPath = `/${next}${stripped === '/' ? '' : stripped}`;

    // 로그인 사용자: BE 동기화 (실패해도 UI 영향 없음)
    if (isLoggedIn) {
      void updateLocaleApi(next).catch(() => {
        /* silent — locale 동기화 실패는 사용자 경험에 무관 */
      });
    }

    if (typeof window !== 'undefined') {
      window.location.assign(newPath);
    }
  };
}

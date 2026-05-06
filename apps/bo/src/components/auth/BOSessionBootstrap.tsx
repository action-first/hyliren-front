'use client';

import { useEffect } from 'react';
import { useBOAuthStore } from '@/store/bo-auth';

/**
 * 첫 mount 에 /api/admin/auth/me 호출 — cookie 기반 세션 복원.
 *
 * middleware 가 SSR 단계에서 cookie 없는 요청을 이미 /login 으로 보내므로,
 * 본 컴포넌트가 도달했다는 건 cookie 존재. 그래도 정합성을 위해 me 호출 →
 * member 정보를 store 에 채움 (name·email 등 sidebar 표시용).
 */
export function BOSessionBootstrap() {
  const refreshSession = useBOAuthStore((s) => s.refreshSession);

  useEffect(() => {
    void refreshSession();
  }, [refreshSession]);

  return null;
}

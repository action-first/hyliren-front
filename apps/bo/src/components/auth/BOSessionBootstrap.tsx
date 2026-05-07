'use client';

import { useEffect } from 'react';
import { useBOAuthStore } from '@/store/bo-auth';
import { subscribeAdminStorageSync } from '@/lib/auth/session';

/**
 * 첫 mount + storage 변화 감지 — admin 세션 부트스트랩.
 *
 * - mount: localStorage 의 token 존재 시 /auth/me 호출해 member 복원
 * - storage: 다른 탭에서 logout/login 발생 시 동기화
 */
export function BOSessionBootstrap() {
  const refreshSession = useBOAuthStore((s) => s.refreshSession);
  const setMember = useBOAuthStore((s) => s.setMember);

  useEffect(() => {
    void refreshSession();
    return subscribeAdminStorageSync(
      () => setMember(null),
      () => { void refreshSession(); },
    );
  }, [refreshSession, setMember]);

  return null;
}

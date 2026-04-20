'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/store/auth';
import { subscribeStorageSync } from '@/lib/auth/session';

/**
 * 최상위 layout에서 1회 마운트. 부팅 시 /me로 세션 복원 + 멀티탭 storage 이벤트 동기화.
 * UI를 렌더링하지 않는다.
 */
export function SessionBootstrap() {
  const refreshSession = useAuthStore((s) => s.refreshSession);
  const setUser = useAuthStore((s) => s.setUser);

  useEffect(() => {
    void refreshSession();

    const unsubscribe = subscribeStorageSync(
      () => { setUser(null); },
      () => { void refreshSession(); },
    );
    return unsubscribe;
  }, [refreshSession, setUser]);

  return null;
}

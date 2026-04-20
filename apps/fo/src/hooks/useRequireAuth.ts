import { useEffect } from 'react';
import { useAuthStore } from '@/store/auth';

/**
 * 인증이 필요한 화면에서 사용. 게스트 상태일 때 onUnauthorized 콜백을 트리거한다.
 * status === 'idle'(부팅 중) 동안에는 콜백을 지연시킨다.
 */
export function useRequireAuth(onUnauthorized: () => void): {
  isAuthenticated: boolean;
  isChecking: boolean;
} {
  const status = useAuthStore((s) => s.status);

  useEffect(() => {
    if (status === 'guest') {
      onUnauthorized();
    }
  }, [status, onUnauthorized]);

  return {
    isAuthenticated: status === 'authenticated',
    isChecking: status === 'idle' || status === 'authenticating',
  };
}

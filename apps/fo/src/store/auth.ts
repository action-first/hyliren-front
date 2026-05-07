import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '@hyliren/shared';
import { authApi, onForcedLogout } from '@/lib/api';
import type { LoginInput, RegisterInput } from '@/lib/api';
import { tokenStore } from '@/lib/auth/token-store';
import { useLocaleStore } from './locale';

/**
 * user.locale 을 UI locale store 와 동기화.
 *
 * 다른 디바이스에서 ja 로 설정한 사용자가 새 디바이스에서 로그인 시 user.locale=ja 가
 * 반환되며, 이 함수가 useLocaleStore 를 ja 로 즉시 전환하여 디바이스 간 일관성 유지.
 *
 * 동일 locale 이면 set 호출 생략 — 불필요한 t 함수 reference 갱신/리렌더 회피.
 */
function syncUiLocale(user: User): void {
  const current = useLocaleStore.getState().locale;
  if (user.locale !== current) {
    useLocaleStore.getState().setLocale(user.locale);
  }
}

export type AuthStatus = 'idle' | 'authenticating' | 'authenticated' | 'guest';

/** 로그아웃 시 호출할 cleanup 콜백 등록용 */
const logoutCleanups: Array<() => void> = [];
export function onLogout(cleanup: () => void) {
  logoutCleanups.push(cleanup);
}

interface AuthState {
  user: User | null;
  status: AuthStatus;
  /** 편의 파생값 — status === 'authenticated'과 동일. 컴포넌트 호환성 유지용. */
  isLoggedIn: boolean;
  isGuest: boolean;

  setUser: (user: User | null) => void;
  loginWithPassword: (input: LoginInput) => Promise<void>;
  registerWithPassword: (input: RegisterInput) => Promise<void>;
  refreshSession: () => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      status: 'idle',
      isLoggedIn: false,
      isGuest: true,

      setUser: (user) => {
        set({
          user,
          status: user ? 'authenticated' : 'guest',
          isLoggedIn: !!user,
          isGuest: !user,
        });
        // 로그인 사용자의 user.locale 을 UI store 와 동기화 (디바이스 간 일관성).
        // logout 시(user=null) 에는 마지막 locale 유지 — 비로그인 상태에서도 UX 연속성.
        if (user) syncUiLocale(user);
      },

      loginWithPassword: async (input) => {
        set({ status: 'authenticating' });
        try {
          await authApi.login(input);
          const user = await authApi.fetchMe();
          get().setUser(user);
        } catch (err) {
          get().setUser(null);
          throw err;
        }
      },

      registerWithPassword: async (input) => {
        set({ status: 'authenticating' });
        try {
          await authApi.register(input);
          const user = await authApi.fetchMe();
          get().setUser(user);
        } catch (err) {
          get().setUser(null);
          throw err;
        }
      },

      refreshSession: async () => {
        const token = tokenStore.getAccessToken();
        if (!token) {
          get().setUser(null);
          return;
        }
        try {
          const user = await authApi.fetchMe();
          get().setUser(user);
        } catch {
          get().setUser(null);
        }
      },

      logout: async () => {
        try {
          await authApi.logout();
        } catch {
          // 서버 실패해도 클라이언트 토큰은 확실히 제거되도록 fallthrough.
        }
        tokenStore.clearTokens();
        logoutCleanups.forEach(fn => fn());
        get().setUser(null);
      },
    }),
    {
      name: 'hyliren-auth',
      partialize: (state) => ({ user: state.user }),
      onRehydrateStorage: () => (state) => {
        if (!state) { return; }
        if (state.user) {
          state.status = 'authenticated';
          state.isLoggedIn = true;
          state.isGuest = false;
          // 페이지 새로고침 후 복원 시점에도 user.locale ↔ UI store 정렬.
          // useLocaleStore 도 자체 persist 가 있어 어긋날 가능성 (디바이스 간) → user 우선.
          syncUiLocale(state.user);
        } else {
          state.status = 'guest';
          state.isLoggedIn = false;
          state.isGuest = true;
        }
      },
    },
  ),
);

// 401 refresh 실패 시 클라이언트에서 받는 강제 로그아웃 신호.
// 모듈 로드 시점 1회만 구독 — SSR 환경에서 안전하도록 window 체크.
if (typeof window !== 'undefined') {
  onForcedLogout(() => {
    useAuthStore.setState({
      user: null,
      status: 'guest',
      isLoggedIn: false,
      isGuest: true,
    });
  });
}

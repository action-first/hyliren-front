import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authApi, onForcedLogout } from '@/lib/api';
import type { User } from '@hyliren/shared';
import type { LoginInput, RegisterInput } from '@/lib/api';
import { tokenStore } from '@/lib/auth/token-store';

/**
 * user.locale ↔ path 자동 동기화는 의도적으로 수행하지 않는다.
 *
 * 이유:
 *   - 사용자가 명시 path (`/ko/...`) 로 진입한 경우 그 lang 이 현재 의도 (가장 강한 신호)
 *   - user.locale 은 다른 디바이스에서의 마지막 명시 선택 — 현재 디바이스 의도가 아님
 *   - 자동 redirect 는 사용자가 의외로 다른 lang 화면을 보게 만드는 UX 결함
 *
 * 디바이스 간 user.locale 동기화 흐름:
 *   1. 마이페이지 / LanguageSwitcher 에서 명시 선택 → useLocaleSwitch 가 path navigation
 *      + PATCH /auth/locale (DB 갱신)
 *   2. 다른 디바이스 첫 진입 시 cookie 없음 → Accept-Language fallback
 *      → 그 디바이스에서도 사용자가 마이페이지에서 lang 변경 가능
 *   3. user.locale 자체는 향후 추천/이메일 등 BE 측 콘텐츠 lang 결정에 활용
 */

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

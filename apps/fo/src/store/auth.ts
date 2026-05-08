import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authApi, onForcedLogout } from '@/lib/api';
import { isLocale, type User } from '@hyliren/shared';
import type { LoginInput, RegisterInput } from '@/lib/api';
import { tokenStore } from '@/lib/auth/token-store';

/**
 * user.locale ↔ path 동기화 — Soft auto-redirect.
 *
 * 정책 (CLAUDE.md "i18n 라우팅 정책" 절):
 *   - 로그인 / 회원가입 직후에만 1회 path lang 을 user.locale 로 정합. (디바이스 간 일관성)
 *   - refreshSession (같은 디바이스 페이지 reload) 은 동기화 X — 현재 디바이스 path 신호 존중.
 *   - 게스트 진입 / 명시 path 공유 (친구 카톡 링크) 는 redirect X — middleware 의 cookie/AL 우선.
 *   - 마이페이지 lang 변경은 useLocaleSwitch 에서 path navigation + PATCH /auth/locale.
 */
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

function syncLocaleToPath(user: User): void {
  if (typeof window === 'undefined') return;
  const segments = window.location.pathname.split('/').filter(Boolean);
  const first = segments[0];
  if (!first || !isLocale(first)) return; // middleware 미통과 케이스 (이론상 도달 X)
  if (first === user.locale) return;       // 이미 정합

  // user.locale 로 path navigate + cookie 동기화 (다음 진입 middleware 일관성).
  // window.location.assign 으로 hard navigation — layout 재마운트로 LocaleStoreProvider
  // initialLocale 이 새 lang 으로 SSR 정합 (router.replace 는 RSC 만 갱신).
  document.cookie = `mimyo-locale=${user.locale}; path=/; max-age=${COOKIE_MAX_AGE}; samesite=lax`;
  const newPath = window.location.pathname.replace(`/${first}`, `/${user.locale}`);
  window.location.assign(`${newPath}${window.location.search}`);
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
      },

      loginWithPassword: async (input) => {
        set({ status: 'authenticating' });
        try {
          await authApi.login(input);
          const user = await authApi.fetchMe();
          get().setUser(user);
          syncLocaleToPath(user);
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
          syncLocaleToPath(user);
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

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '@hyliren/shared';

/** 로그아웃 시 호출할 cleanup 콜백 등록용 */
const logoutCleanups: Array<() => void> = [];
export function onLogout(cleanup: () => void) {
  logoutCleanups.push(cleanup);
}

interface AuthState {
  user: User | null;
  isLoggedIn: boolean;
  isGuest: boolean;

  login: (user: User) => void;
  logout: () => void;
  setGuest: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isLoggedIn: false,
      isGuest: true,

      login: (user) => set({ user, isLoggedIn: true, isGuest: false }),
      logout: () => {
        logoutCleanups.forEach(fn => fn());
        set({ user: null, isLoggedIn: false, isGuest: true });
      },
      setGuest: () => set({ user: null, isLoggedIn: false, isGuest: true }),
    }),
    {
      name: 'hyliren-auth',
      partialize: (state) => ({ user: state.user, isLoggedIn: state.isLoggedIn, isGuest: state.isGuest }),
    },
  ),
);

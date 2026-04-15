import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '@hyliren/shared';

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
      logout: () => set({ user: null, isLoggedIn: false, isGuest: true }),
      setGuest: () => set({ user: null, isLoggedIn: false, isGuest: true }),
    }),
    {
      name: 'hyliren-auth',
      partialize: (state) => ({ user: state.user, isLoggedIn: state.isLoggedIn, isGuest: state.isGuest }),
    },
  ),
);

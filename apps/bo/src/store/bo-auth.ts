'use client';

import { create } from 'zustand';
import type { Member } from '@hyliren/shared';
import * as adminAuthApi from '@/lib/api/admin-auth';
import { ApiError } from '@/lib/api/errors';

export type BOAuthStatus = 'idle' | 'authenticating' | 'authenticated' | 'guest';

/**
 * Admin (BO) 인증 store.
 *
 * 토큰은 httpOnly cookie 라 client store 는 member 정보만 보유.
 * 새 탭 / 새로고침 시 BOSessionBootstrap 이 /api/admin/auth/me 로 복원.
 */
interface BOAuthState {
  member: Member | null;
  status: BOAuthStatus;
  error: string | null;
  setMember: (member: Member | null) => void;
  loginWithPassword: (input: adminAuthApi.AdminLoginInput) => Promise<void>;
  refreshSession: () => Promise<void>;
  logout: () => Promise<void>;
}

export const useBOAuthStore = create<BOAuthState>()((set) => ({
  member: null,
  status: 'idle',
  error: null,

  setMember: (member) =>
    set({
      member,
      status: member ? 'authenticated' : 'guest',
      error: null,
    }),

  loginWithPassword: async (input) => {
    set({ status: 'authenticating', error: null });
    try {
      const member = await adminAuthApi.login(input);
      set({ member, status: 'authenticated', error: null });
    } catch (e) {
      const message =
        e instanceof ApiError ? e.message : e instanceof Error ? e.message : '로그인에 실패했습니다.';
      set({ status: 'guest', member: null, error: message });
      throw e;
    }
  },

  refreshSession: async () => {
    set({ status: 'authenticating', error: null });
    try {
      const member = await adminAuthApi.fetchMe();
      set({ member, status: 'authenticated', error: null });
    } catch {
      // 401 (no/invalid session) 은 정상 흐름 — guest 로 전환만.
      set({ member: null, status: 'guest' });
    }
  },

  logout: async () => {
    try {
      await adminAuthApi.logout();
    } catch {
      // 서버 cookie clear 실패해도 client 상태는 우선 비우기.
    } finally {
      set({ member: null, status: 'guest', error: null });
    }
  },
}));

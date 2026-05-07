'use client';

import { create } from 'zustand';
import type { Member } from '@hyliren/shared';
import * as adminAuthApi from '@/lib/api/admin-auth';
import { adminTokenStore } from '@/lib/auth/token-store';

export type BOAuthStatus = 'idle' | 'authenticating' | 'authenticated' | 'guest';

/**
 * Admin (BO) 인증 store. PO 의 usePOAuthStore 와 동형.
 *
 * 토큰은 localStorage (`hyliren-bo-tokens`). client.ts 가 fetch 마다 Authorization
 * 첨부 + 401 자동 refresh. BOSessionBootstrap 이 mount 시 refreshSession 호출.
 */
interface BOAuthState {
  member: Member | null;
  status: BOAuthStatus;
  isGuest: boolean;
  error: string | null;
  setMember: (member: Member | null) => void;
  loginWithPassword: (input: adminAuthApi.AdminLoginInput) => Promise<void>;
  refreshSession: () => Promise<void>;
  logout: () => Promise<void>;
}

export const useBOAuthStore = create<BOAuthState>()((set) => ({
  member: null,
  status: 'idle',
  isGuest: false,
  error: null,

  setMember: (member) =>
    set({
      member,
      status: member ? 'authenticated' : 'guest',
      isGuest: !member,
      error: null,
    }),

  loginWithPassword: async (input) => {
    set({ status: 'authenticating', error: null });
    try {
      const member = await adminAuthApi.login(input);
      set({ member, status: 'authenticated', isGuest: false, error: null });
    } catch (e) {
      const message = e instanceof Error ? e.message : '로그인에 실패했습니다';
      adminTokenStore.clearTokens();
      set({ status: 'guest', member: null, isGuest: true, error: message });
      throw e;
    }
  },

  refreshSession: async () => {
    const token = adminTokenStore.getAccessToken();
    if (!token) {
      set({ member: null, status: 'guest', isGuest: true, error: null });
      return;
    }

    // client.ts 가 401 시 자동 refresh + retry 처리. 여기 catch 는 refresh 까지 실패한 경우만.
    set({ status: 'authenticating', error: null });
    try {
      const member = await adminAuthApi.fetchMe();
      set({ member, status: 'authenticated', isGuest: false, error: null });
    } catch {
      adminTokenStore.clearTokens();
      set({ member: null, status: 'guest', isGuest: true });
    }
  },

  logout: async () => {
    let serverFailed = false;
    try {
      await adminAuthApi.logout();
    } catch {
      serverFailed = true;
    } finally {
      adminTokenStore.clearTokens();
      set({ member: null, status: 'guest', isGuest: true, error: null });
    }
    if (serverFailed) {
      throw new Error('로그아웃 정리에 실패했습니다');
    }
  },
}));

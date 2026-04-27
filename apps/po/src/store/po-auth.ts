'use client';

import { create } from 'zustand';
import type { Member } from '@hyliren/shared';
import * as partnerAuthApi from '@/lib/api/partner-auth';
import { partnerTokenStore } from '@/lib/auth/token-store';

export type POAuthStatus = 'idle' | 'authenticating' | 'authenticated' | 'guest';

/**
 * Partner 인증 상태 store. 프로필은 useMyPartnerProfile() RQ 훅이 BE 직접 조회.
 */
interface POAuthState {
  member: Member | null;
  status: POAuthStatus;
  isGuest: boolean;
  error: string | null;
  setMember: (member: Member | null) => void;
  loginWithPassword: (input: partnerAuthApi.PartnerLoginInput) => Promise<void>;
  refreshSession: () => Promise<void>;
  logout: () => Promise<void>;
}

export const usePOAuthStore = create<POAuthState>()(
  (set) => ({
    member: null,
    status: 'idle',
    isGuest: false,
    error: null,

    setMember: (member) => set({
      member,
      status: member ? 'authenticated' : 'guest',
      isGuest: !member,
      error: null,
    }),

    loginWithPassword: async (input) => {
      set({ status: 'authenticating', error: null });
      try {
        const member = await partnerAuthApi.login(input);
        set({ member, status: 'authenticated', isGuest: false, error: null });
      } catch (e) {
        const message = e instanceof Error ? e.message : '로그인에 실패했습니다';
        partnerTokenStore.clearTokens();
        set({ status: 'guest', member: null, isGuest: true, error: message });
        throw e;
      }
    },

    refreshSession: async () => {
      const token = partnerTokenStore.getAccessToken();
      if (!token) {
        set({ member: null, status: 'guest', isGuest: true, error: null });
        return;
      }

      // client.ts 가 401 시 자동 refresh + retry 처리. 이 단계의 catch 는
      // refresh 까지 실패한 경우(=세션 만료)만 도달.
      set({ status: 'authenticating', error: null });
      try {
        const member = await partnerAuthApi.fetchMe();
        set({ member, status: 'authenticated', isGuest: false, error: null });
      } catch {
        partnerTokenStore.clearTokens();
        set({ member: null, status: 'guest', isGuest: true });
      }
    },

    logout: async () => {
      let serverFailed = false;
      try {
        await partnerAuthApi.logout();
      } catch {
        serverFailed = true;
      } finally {
        partnerTokenStore.clearTokens();
        set({ member: null, status: 'guest', isGuest: true, error: null });
      }
      if (serverFailed) {
        throw new Error('로그아웃 정리에 실패했습니다');
      }
    },
  }),
);

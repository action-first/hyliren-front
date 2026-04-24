'use client';

import { create } from 'zustand';
import type { Member, PartnerProfile } from '@hyliren/shared';
import { MOCK_PARTNER_PROFILES } from '@hyliren/shared';
import * as partnerAuthApi from '@/lib/api/partner-auth';
import { partnerTokenStore } from '@/lib/auth/token-store';

export type POAuthStatus = 'idle' | 'authenticating' | 'authenticated' | 'guest';

interface POAuthState {
  member: Member | null;
  profile: PartnerProfile | null;
  status: POAuthStatus;
  isGuest: boolean;
  error: string | null;
  setMember: (member: Member | null) => void;
  loginWithPassword: (input: partnerAuthApi.PartnerLoginInput) => Promise<void>;
  refreshSession: () => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (updates: Partial<Omit<PartnerProfile, 'memberId' | 'createdAt'>>) => void;
}

function profileFor(memberId: string): PartnerProfile | null {
  return MOCK_PARTNER_PROFILES.find(p => p.memberId === memberId) ?? null;
}

export const usePOAuthStore = create<POAuthState>()(
  (set) => ({
    member: null,
    profile: null,
    status: 'idle',
    isGuest: false,
    error: null,

    setMember: (member) => set({
      member,
      profile: member ? profileFor(member.id) : null,
      status: member ? 'authenticated' : 'guest',
      isGuest: !member,
      error: null,
    }),

    loginWithPassword: async (input) => {
      set({ status: 'authenticating', error: null });
      try {
        const member = await partnerAuthApi.login(input);
        set({
          member,
          profile: profileFor(member.id),
          status: 'authenticated',
          isGuest: false,
          error: null,
        });
      } catch (e) {
        const message = e instanceof Error ? e.message : '로그인에 실패했습니다';
        partnerTokenStore.clearTokens();
        set({ status: 'guest', member: null, profile: null, isGuest: true, error: message });
        throw e;
      }
    },

    refreshSession: async () => {
      const token = partnerTokenStore.getAccessToken();
      if (!token) {
        set({ member: null, profile: null, status: 'guest', isGuest: true, error: null });
        return;
      }

      set({ status: 'authenticating', error: null });
      try {
        const member = await partnerAuthApi.fetchMe();
        set({
          member,
          profile: profileFor(member.id),
          status: 'authenticated',
          isGuest: false,
          error: null,
        });
      } catch {
        try {
          await partnerAuthApi.refreshTokens();
          const member = await partnerAuthApi.fetchMe();
          set({
            member,
            profile: profileFor(member.id),
            status: 'authenticated',
            isGuest: false,
            error: null,
          });
        } catch {
          partnerTokenStore.clearTokens();
          set({ member: null, profile: null, status: 'guest', isGuest: true });
        }
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
        set({ member: null, profile: null, status: 'guest', isGuest: true, error: null });
      }
      if (serverFailed) {
        throw new Error('로그아웃 정리에 실패했습니다');
      }
    },

    updateProfile: (updates) =>
      set(s => ({
        profile: s.profile ? { ...s.profile, ...updates } : null,
      })),
  }),
);

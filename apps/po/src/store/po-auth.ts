'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Member, PartnerProfile } from '@hyliren/shared';
import { MOCK_MEMBERS, MOCK_PARTNER_PROFILES } from '@hyliren/shared';

interface POAuthState {
  member: Member | null;
  profile: PartnerProfile | null;
  isGuest: boolean;
  login: (memberId: string) => void;
  logout: () => void;
  updateProfile: (updates: Partial<Omit<PartnerProfile, 'memberId' | 'createdAt'>>) => void;
}

export const usePOAuthStore = create<POAuthState>()(
  persist(
    (set) => ({
      member: MOCK_MEMBERS.find(m => m.id === 'm-001') ?? null,
      profile: MOCK_PARTNER_PROFILES.find(p => p.memberId === 'm-001') ?? null,
      isGuest: false,

      login: (memberId) => {
        const member = MOCK_MEMBERS.find(m => m.id === memberId) ?? null;
        const profile = MOCK_PARTNER_PROFILES.find(p => p.memberId === memberId) ?? null;
        set({ member, profile, isGuest: false });
      },

      logout: () => set({ member: null, profile: null, isGuest: true }),

      updateProfile: (updates) =>
        set(s => ({
          profile: s.profile ? { ...s.profile, ...updates } : null,
        })),
    }),
    { name: 'po-auth' },
  ),
);

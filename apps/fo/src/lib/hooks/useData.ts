/**
 * FO 데이터 서비스 레이어
 *
 * 현재: MOCK 데이터 + API 혼합
 * 미래: 이 파일의 내부 구현만 API fetch로 교체하면 전체 앱이 전환됨
 *
 * 사용처에서는 이 hooks만 import — MOCK_* 직접 import 금지
 */

import { useState, useEffect } from 'react';
import {
  MOCK_CONCERNS, MOCK_PROPOSALS, MOCK_PROPOSAL_ITEMS,
  MOCK_PARTNER_PROFILES, MOCK_CONCERN_PHOTOS,
} from '@hyliren/shared';
import type { Concern, Proposal, ProposalItem, PartnerProfile, ConcernPhoto } from '@hyliren/shared';
import { useAuthStore } from '@/store/auth';
import { useUserConcernsStore } from '@/store/user-concerns';

// ---- Concerns ----

/** 현재 유저의 고민 목록 (MOCK + 유저 생성분) */
export function useMyConcerns() {
  const userId = useAuthStore(s => s.user?.id) ?? 'u-001';
  const userCreated = useUserConcernsStore(s => s.concerns);

  const concerns = [
    ...MOCK_CONCERNS.filter(c => c.userId === userId && !c.deletedAt && c.status !== 'draft'),
    ...userCreated,
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return concerns;
}

/** 특정 concern ID 조회 */
export function useConcern(id: string) {
  const all = useMyConcerns();
  return all.find(c => c.id === id) ?? MOCK_CONCERNS.find(c => c.id === id) ?? null;
}

// ---- Proposals ----

/** 특정 concern에 대한 제안서 목록 (API fetch) */
export function useProposalsForConcern(concernId: string) {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [items, setItems] = useState<ProposalItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch(`/api/proposals?concernId=${concernId}`)
      .then(r => { if (!r.ok) throw new Error(); return r.json(); })
      .then(data => {
        setProposals(data.proposals ?? []);
        setItems(data.items ?? []);
        setLoading(false);
      })
      .catch(() => { setError(true); setLoading(false); });
  }, [concernId]);

  return { proposals, items, loading, error };
}

// ---- Partner Profiles ----

/** 파트너 프로필 조회 (현재 MOCK, 미래 API) */
export function usePartnerProfile(memberId: string): PartnerProfile | null {
  return MOCK_PARTNER_PROFILES.find(p => p.memberId === memberId) ?? null;
}

export function usePartnerProfiles(): PartnerProfile[] {
  return MOCK_PARTNER_PROFILES;
}

// ---- Photos ----

/** 고민 사진 조회 */
export function useConcernPhotos(concernId: string): ConcernPhoto[] {
  return MOCK_CONCERN_PHOTOS.filter(p => p.concernId === concernId);
}

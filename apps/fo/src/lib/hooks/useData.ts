/**
 * FO 데이터 서비스 레이어
 *
 * 사용처에서는 이 hooks만 import — MOCK_* 직접 import 금지
 */

import { useState, useEffect } from 'react';
import { MOCK_PARTNER_PROFILES, MOCK_CONCERN_PHOTOS } from '@hyliren/shared';
import type { Proposal, ProposalItem, PartnerProfile, ConcernPhoto } from '@hyliren/shared';

export { useMyConcerns, useConcern } from '@/lib/hooks/concern';

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

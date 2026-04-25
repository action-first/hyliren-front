'use client';

import { useEffect, useState } from 'react';
import type { Concern, PartnerProfile, Proposal, ProposalItem } from '@hyliren/shared';
import { Spinner } from '@hyliren/ui';
import { DecisionPageClient } from '@/components/decision/DecisionPageClient';
import { listConcerns, mapConcernListItem } from '@/lib/api/concern';
import { listProposals, mapProposal, mapProposalItem, extractHospitalInfo } from '@/lib/api/proposal';
import type { ProposalWithHospital } from '@/lib/hooks/proposal';

interface ProposalGroup {
  concern: Concern;
  proposals: Proposal[];
}

export default function DecisionPage() {
  const [groups, setGroups] = useState<ProposalGroup[]>([]);
  const [items, setItems] = useState<ProposalItem[]>([]);
  const [profiles, setProfiles] = useState<PartnerProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listConcerns({ limit: 50 })
      .then(async (wireList) => {
        const activeConcerns = wireList.concerns.filter(c => c.proposalCount > 0);

        if (activeConcerns.length === 0) {
          setGroups([]);
          setItems([]);
          setProfiles([]);
          setLoading(false);
          return;
        }

        const results = await Promise.all(
          activeConcerns.map(async (wireConcern) => {
            const concern = mapConcernListItem(wireConcern);
            const wire = await listProposals(wireConcern.id);
            const proposals: ProposalWithHospital[] = wire.proposals.map((p) => ({
              ...mapProposal(p),
              ...extractHospitalInfo(p),
            }));
            const proposalItems = wire.proposals.flatMap((p) => p.items.map(mapProposalItem));
            return { concern, proposals, items: proposalItems };
          }),
        );

        setGroups(results.map(({ concern, proposals }) => ({ concern, proposals })));
        setItems(results.flatMap(r => r.items));

        // 자식 컴포넌트(profile.find by memberId) 호환을 위해 proposals 의
        // hospitalName 으로부터 profiles 합성. verified/description 등은 백엔드
        // listProposals DTO 가 노출하지 않아 임시 false/빈 문자열 (detail DTO
        // 의 hospitalIsCertified 가 list 로 확장되면 교체 예정).
        const synthesizedProfiles = new Map<string, PartnerProfile>();
        results.forEach(r => r.proposals.forEach(p => {
          if (synthesizedProfiles.has(p.memberId)) return;
          synthesizedProfiles.set(p.memberId, {
            memberId: p.memberId,
            hospitalName: p.hospitalName,
            hospitalNameZh: null,
            description: null,
            descriptionZh: null,
            address: null,
            phone: null,
            website: null,
            logoUrl: p.hospitalLogo,
            coverImageUrl: null,
            specialties: [],
            verified: false,
            createdAt: new Date().toISOString(),
          });
        }));
        setProfiles(Array.from(synthesizedProfiles.values()));
        setLoading(false);
      })
      .catch(() => {
        setGroups([]);
        setItems([]);
        setProfiles([]);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center min-h-[60vh]"><Spinner /></div>;
  }

  const totalProposalCount = groups.reduce((sum, g) => sum + g.proposals.length, 0);

  return (
    <DecisionPageClient
      groups={groups}
      profiles={profiles}
      items={items}
      totalProposalCount={totalProposalCount}
    />
  );
}

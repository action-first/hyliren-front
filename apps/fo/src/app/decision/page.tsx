'use client';

import { useEffect, useState } from 'react';
import {
  MOCK_PARTNER_PROFILES,
  MOCK_PROPOSAL_ITEMS,
} from '@hyliren/shared';
import type { Concern, Proposal, ProposalItem } from '@hyliren/shared';
import { Spinner } from '@hyliren/ui';
import { DecisionPageClient } from '@/components/decision/DecisionPageClient';
import { listConcerns, mapConcernListItem } from '@/lib/api/concern';
import { listProposals, mapProposal, mapProposalItem, extractHospitalInfo } from '@/lib/api/proposal';

interface ProposalGroup {
  concern: Concern;
  proposals: Proposal[];
}

export default function DecisionPage() {
  const [groups, setGroups] = useState<ProposalGroup[]>([]);
  const [items, setItems] = useState<ProposalItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listConcerns({ limit: 50 })
      .then(async (wireList) => {
        const activeConcerns = wireList.concerns.filter(c => c.proposalCount > 0);

        if (activeConcerns.length === 0) {
          setGroups([]);
          setItems(MOCK_PROPOSAL_ITEMS);
          setLoading(false);
          return;
        }

        const results = await Promise.all(
          activeConcerns.map(async (wireConcern) => {
            const concern = mapConcernListItem(wireConcern);
            const wire = await listProposals(wireConcern.id);
            const proposals = wire.proposals.map((p) => ({
              ...mapProposal(p),
              ...extractHospitalInfo(p),
            }));
            const proposalItems = wire.proposals.flatMap((p) => p.items.map(mapProposalItem));
            return { concern, proposals, items: proposalItems };
          }),
        );

        setGroups(results.map(({ concern, proposals }) => ({ concern, proposals })));
        setItems(results.flatMap(r => r.items));
        setLoading(false);
      })
      .catch(() => {
        setGroups([]);
        setItems(MOCK_PROPOSAL_ITEMS);
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
      profiles={MOCK_PARTNER_PROFILES}
      items={items}
      totalProposalCount={totalProposalCount}
    />
  );
}

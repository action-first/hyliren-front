import { useState, useEffect } from 'react';
import type { Proposal, ProposalItem } from '@hyliren/shared';

import { listProposals, mapProposal, mapProposalItem, extractHospitalInfo } from '@/lib/api/proposal';

export interface ProposalWithHospital extends Proposal {
  hospitalName: string;
  hospitalLogo: string | null;
}

export function useProposalsForConcern(concernId: string) {
  const [proposals, setProposals] = useState<ProposalWithHospital[]>([]);
  const [items, setItems] = useState<ProposalItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!concernId) return;
    setLoading(true);
    setError(false);

    listProposals(concernId)
      .then((wire) => {
        const mapped = wire.proposals.map((p) => ({
          ...mapProposal(p),
          ...extractHospitalInfo(p),
        }));
        const allItems = wire.proposals.flatMap((p) => p.items.map(mapProposalItem));
        setProposals(mapped);
        setItems(allItems);
        setLoading(false);
      })
      .catch(() => {
        setError(true);
        setLoading(false);
      });
  }, [concernId]);

  return { proposals, items, loading, error };
}

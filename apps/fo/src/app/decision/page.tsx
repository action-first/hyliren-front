import { MOCK_CONCERNS, MOCK_PROPOSALS, MOCK_PARTNER_PROFILES, MOCK_PROPOSAL_ITEMS } from '@hyliren/shared';
import { DecisionPageClient } from '@/components/decision/DecisionPageClient';

export default function DecisionPage() {
  const activeProposals = MOCK_PROPOSALS
    .filter(p => p.isActive && p.status !== 'draft')
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const concernIds = [...new Set(activeProposals.map(p => p.concernId))];

  const groups = concernIds
    .map(cid => {
      const concern = MOCK_CONCERNS.find(c => c.id === cid);
      if (!concern) return null;
      return {
        concern,
        proposals: activeProposals.filter(p => p.concernId === cid),
      };
    })
    .filter((g): g is NonNullable<typeof g> => g !== null);

  return (
    <DecisionPageClient
      groups={groups}
      profiles={MOCK_PARTNER_PROFILES}
      items={MOCK_PROPOSAL_ITEMS}
      totalProposalCount={activeProposals.length}
    />
  );
}

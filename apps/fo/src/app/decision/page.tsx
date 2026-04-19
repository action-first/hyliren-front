import { MOCK_PARTNER_PROFILES } from '@hyliren/shared';
import { getConcerns } from '@hyliren/shared/src/server/data-store';
import { getProposals, getProposalItems } from '@hyliren/shared/src/server/data-store';
import { DecisionPageClient } from '@/components/decision/DecisionPageClient';

export const dynamic = 'force-dynamic';

export default function DecisionPage() {
  const allProposals = getProposals();
  const allConcerns = getConcerns();
  const allItems = getProposalItems();

  const activeProposals = allProposals
    .filter(p => p.isActive && p.status !== 'draft')
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const concernIds = [...new Set(activeProposals.map(p => p.concernId))];

  const groups = concernIds
    .map(cid => {
      const concern = allConcerns.find(c => c.id === cid);
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
      items={allItems}
      totalProposalCount={activeProposals.length}
    />
  );
}

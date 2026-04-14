'use client';

import type { Concern, Proposal, PartnerProfile, ProposalItem } from '@hyliren/shared';
import { Badge } from '@hyliren/ui';
import { SelectableProposalCard } from './SelectableProposalCard';
import { useDecisionStore } from '@/store/decision';
import { VALUE_PROPS } from '@/lib/constants';
import { STATUS_LABELS, STATUS_COLORS } from '@/lib/lifecycle';

interface Props {
  concern: Concern;
  proposals: Proposal[];
  profiles: PartnerProfile[];
  items: ProposalItem[];
  onCardClick?: (proposalId: string) => void;
}

export function ProposalGroupSection({ concern, proposals, profiles, items, onCardClick }: Props) {
  const { selectedProposalIds, toggleSelect } = useDecisionStore();

  return (
    <section className="mb-7">
      {/* Group header */}
      <div className="flex items-center gap-2 mb-3">
        <Badge variant="info">{concern.bodyArea}</Badge>
        {concern.bodyAreaDetail && (
          <span className="text-[12px] text-[var(--color-text-dim)]">{concern.bodyAreaDetail}</span>
        )}
        <span className="ml-auto text-[10px] font-medium text-[var(--color-primary)] bg-[var(--color-primary-soft)] px-2 py-0.5 rounded-full">
          {STATUS_LABELS[concern.status] || concern.status}
        </span>
      </div>

      {/* Proposal cards — horizontal scroll if 3+, vertical if 1-2 */}
      {proposals.length > 2 ? (
        <div className="flex gap-3 overflow-x-auto pb-1 -mr-5 pr-5" style={{ scrollbarWidth: 'none' }}>
          {proposals.map((p, idx) => {
            const profile = profiles.find(pp => pp.memberId === p.memberId);
            const proposalItems = items.filter(i => i.proposalId === p.id);
            const meta = `회복 ${p.recoveryDays}일 · ${p.anesthesiaType === 'local' ? '부분' : p.anesthesiaType === 'sedation' ? '수면' : '전신'}마취`;
            return (
              <div key={p.id} className="min-w-[15rem] max-w-[16rem] shrink-0">
                <SelectableProposalCard
                  proposalId={p.id}
                  hospitalName={profile?.hospitalName || ''}
                  verified={profile?.verified || false}
                  valueProp={VALUE_PROPS[p.memberId] || profile?.description || ''}
                  price={p.totalPrice}
                  meta={meta}
                  coverTags={proposalItems.slice(0, 2).map(i => i.treatmentName)}
                  quote={p.consultationNote}
                  gradientIndex={idx}
                  selected={selectedProposalIds.has(p.id)}
                  onToggle={() => toggleSelect(p.id)}
                  onCardClick={onCardClick ? () => onCardClick(p.id) : undefined}
                />
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {proposals.map((p, idx) => {
            const profile = profiles.find(pp => pp.memberId === p.memberId);
            const proposalItems = items.filter(i => i.proposalId === p.id);
            const meta = `회복 ${p.recoveryDays}일 · ${p.anesthesiaType === 'local' ? '부분' : p.anesthesiaType === 'sedation' ? '수면' : '전신'}마취`;
            return (
              <SelectableProposalCard
                key={p.id}
                proposalId={p.id}
                hospitalName={profile?.hospitalName || ''}
                verified={profile?.verified || false}
                valueProp={VALUE_PROPS[p.memberId] || profile?.description || ''}
                price={p.totalPrice}
                meta={meta}
                coverTags={proposalItems.slice(0, 2).map(i => i.treatmentName)}
                quote={p.consultationNote}
                gradientIndex={idx}
                selected={selectedProposalIds.has(p.id)}
                onToggle={() => toggleSelect(p.id)}
                  onCardClick={onCardClick ? () => onCardClick(p.id) : undefined}
              />
            );
          })}
        </div>
      )}
    </section>
  );
}

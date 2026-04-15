'use client';

import type { Concern, Proposal, PartnerProfile, ProposalItem } from '@hyliren/shared';
import { Badge } from '@hyliren/ui';
import { SelectableProposalCard } from './SelectableProposalCard';
import { useDecisionStore } from '@/store/decision';
import { VALUE_PROPS } from '@/lib/constants';
import { STATUS_LABELS, STATUS_COLORS } from '@/domain/lifecycle';

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
      {/* 고민 요약 카드 */}
      <div className="rounded-xl bg-[var(--color-bg-secondary)] px-4 py-3.5 mb-3">
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-1.5">
            {concern.bodyAreas.map(area => (
              <Badge key={area} variant="info" size="sm">{area}</Badge>
            ))}
          </div>
          <Badge variant={STATUS_COLORS[concern.status] || 'default'} size="sm">
            {STATUS_LABELS[concern.status] || concern.status}
          </Badge>
        </div>
        <p className="text-[13px] text-[var(--color-text)] leading-snug line-clamp-2 mb-1.5">
          {concern.description}
        </p>
        <div className="flex items-center gap-3 text-[11px] text-[var(--color-text-dim)]">
          {concern.budgetMin && concern.budgetMax && (
            <span>예산 {concern.budgetMin}~{concern.budgetMax}만</span>
          )}
          {concern.visitDateFrom && (
            <span>{concern.visitDateFrom.slice(5)}~ 방문</span>
          )}
          <span className="ml-auto">제안 {proposals.length}건</span>
        </div>
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
                  unread={!p.viewedAt}
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
                unread={!p.viewedAt}
              />
            );
          })}
        </div>
      )}
    </section>
  );
}

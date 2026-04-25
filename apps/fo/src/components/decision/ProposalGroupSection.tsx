'use client';

import { useState } from 'react';
import type { Concern, Proposal, PartnerProfile, ProposalItem } from '@hyliren/shared';
import { Badge } from '@hyliren/ui';
import { ChevronDown, ChevronUp, Banknote, Calendar } from 'lucide-react';
import { SelectableProposalCard } from './SelectableProposalCard';
import { useDecisionStore } from '@/store/decision';
import { VALUE_PROPS } from '@/lib/constants';
import { STATUS_LABELS, STATUS_COLORS } from '@/domain/lifecycle';

import { AREA_ACCENT } from '@/lib/area-styles';

interface Props {
  concern: Concern;
  proposals: Proposal[];
  profiles: PartnerProfile[];
  items: ProposalItem[];
  onCardClick?: (proposalId: string) => void;
}

const INITIAL_SHOW = 2;

export function ProposalGroupSection({ concern, proposals, profiles, items, onCardClick }: Props) {
  const { selectedProposalIds, toggleSelect } = useDecisionStore();
  const [expanded, setExpanded] = useState(false);

  const hasMore = proposals.length > INITIAL_SHOW;
  const visibleProposals = expanded ? proposals : proposals.slice(0, INITIAL_SHOW);
  const hiddenCount = proposals.length - INITIAL_SHOW;
  const accent = AREA_ACCENT[concern.primaryArea] || 'bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)]';

  function renderCard(p: Proposal, idx: number) {
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
  }

  return (
    <section
      id={`concern-${concern.id}`}
      className="mb-6 rounded-[var(--app-radius-md)] bg-[var(--color-bg-secondary)] p-4 scroll-mt-16"
    >
      {/* 고민 헤더 */}
      <div className="flex items-center gap-2 mb-3">
        <div className="flex items-center gap-1.5">
          {concern.bodyAreas.map(area => (
            <span key={area} className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${AREA_ACCENT[area] || accent}`}>
              {area}
            </span>
          ))}
        </div>
        <Badge variant={STATUS_COLORS[concern.status] || 'default'} size="sm">
          {STATUS_LABELS[concern.status] || concern.status}
        </Badge>
        <span className="ml-auto text-[11px] text-[var(--color-text-dim)]">제안 {proposals.length}건</span>
      </div>
      <p className="text-[13px] text-[var(--color-text)] leading-snug line-clamp-2 mb-2">
        {concern.description}
      </p>

      {/* 예산·방문 칩 */}
      <div className="flex items-center gap-2 mb-3">
        {concern.budgetMin && concern.budgetMax && (
          <span className="flex items-center gap-0.5 px-2.5 py-1 rounded-[var(--app-radius-sm)] bg-[var(--color-bg)] text-[11px] font-medium text-[var(--color-text-secondary)]">
            <Banknote size={11} /> {concern.budgetMin}~{concern.budgetMax}만
          </span>
        )}
        {concern.visitDateFrom && (
          <span className="flex items-center gap-0.5 px-2.5 py-1 rounded-[var(--app-radius-sm)] bg-[var(--color-bg)] text-[11px] font-medium text-[var(--color-text-secondary)]">
            <Calendar size={11} /> {concern.visitDateFrom.slice(5)}~ 방문
          </span>
        )}
      </div>

      {/* 구분선 + 제안 라벨 */}
      <div className="flex items-center gap-2 mb-2.5">
        <div className="flex-1 h-px bg-[var(--color-border-light)]" />
        <span className="text-[10px] font-medium text-[var(--color-text-dim)] shrink-0">받은 제안</span>
        <div className="flex-1 h-px bg-[var(--color-border-light)]" />
      </div>

      {/* 제안 카드 */}
      <div className="flex flex-col gap-2.5">
        {visibleProposals.map((p, idx) => renderCard(p, idx))}
      </div>

      {/* 더 보기 / 접기 */}
      {hasMore && (
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="flex items-center justify-center gap-1 w-full mt-2.5 py-2.5 rounded-[var(--app-radius)] border border-dashed border-[var(--color-border-light)] bg-transparent text-[12px] font-medium text-[var(--color-text-secondary)] cursor-pointer"
        >
          {expanded ? (
            <>접기 <ChevronUp size={14} /></>
          ) : (
            <>나머지 {hiddenCount}개 제안 더 보기 <ChevronDown size={14} /></>
          )}
        </button>
      )}
    </section>
  );
}

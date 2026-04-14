'use client';

import { useState } from 'react';
import Link from 'next/link';
import { MOCK_CONCERNS, MOCK_PROPOSALS, MOCK_PROPOSAL_ITEMS, MOCK_PARTNER_PROFILES } from '@hyliren/shared';
import { Button, Badge, MobileBottomCTA } from '@hyliren/ui';
import { ArrowRight } from 'lucide-react';
import { ExperienceCard } from '@/components/ExperienceCard';
import { VALUE_PROPS, CARD_GRADIENTS as GRADIENTS } from '@/lib/constants';
import { use } from 'react';

interface Props { params: Promise<{ id: string }>; }

export default function ProposalListPage({ params }: Props) {
  const { id } = use(params);
  const concern = MOCK_CONCERNS.find(c => c.id === id) || MOCK_CONCERNS[0];
  const proposals = MOCK_PROPOSALS
    .filter(p => p.concernId === concern.id && p.isActive && p.status !== 'draft')
    .sort((a, b) => a.totalPrice - b.totalPrice);

  const [selected, setSelected] = useState<Set<string>>(() => {
    const initial = new Set<string>();
    proposals.forEach(p => { if (p.status === 'shortlisted') initial.add(p.id); });
    return initial;
  });

  const toggleSelect = (pid: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(pid)) next.delete(pid);
      else next.add(pid);
      return next;
    });
  };

  return (
    <>
      <div className="pb-4">
        {/* ── Header ── */}
        <div className="px-5 pt-7 pb-5">
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="info">{concern.bodyArea}</Badge>
            {concern.bodyAreaDetail && (
              <span className="text-[13px] text-[var(--color-text-secondary)]">{concern.bodyAreaDetail}</span>
            )}
          </div>
          <h1 className="text-[1.5rem] font-bold text-[var(--color-text)] leading-tight">
            {proposals.length}개 병원의 제안
          </h1>
          <p className="text-[13px] text-[var(--color-text-secondary)] mt-1.5">
            마음에 드는 제안을 선택해 비교해보세요
          </p>
        </div>

        {/* ── Proposal Cards — Experience Card Inbox ── */}
        <div className="flex flex-col gap-4 px-5">
          {proposals.map((proposal, idx) => {
            const profile = MOCK_PARTNER_PROFILES.find(p => p.memberId === proposal.memberId);
            const items = MOCK_PROPOSAL_ITEMS.filter(i => i.proposalId === proposal.id);
            const isSelected = selected.has(proposal.id);
            const valueProp = VALUE_PROPS[proposal.memberId] || profile?.description || '';
            const meta = [
              `회복 ${proposal.recoveryDays}일`,
              `${proposal.anesthesiaType === 'local' ? '부분' : proposal.anesthesiaType === 'sedation' ? '수면' : '전신'}마취`,
              proposal.hospitalStayDays > 0 ? `입원 ${proposal.hospitalStayDays}일` : '',
            ].filter(Boolean).join(' · ');

            return (
              <ExperienceCard
                key={proposal.id}
                gradient={GRADIENTS[idx % GRADIENTS.length]}
                valueProp={valueProp}
                hospitalName={profile?.hospitalName || ''}
                verified={profile?.verified}
                rating={4.8}
                price={proposal.totalPrice}
                meta={meta}
                coverTags={items.slice(0, 2).map(i => i.treatmentName)}
                quote={proposal.consultationNote}
                selected={isSelected}
                onToggleSelect={() => toggleSelect(proposal.id)}
              />
            );
          })}
        </div>

        <div className="h-24" />
      </div>

      {/* ── Sticky Bottom CTA ── */}
      <MobileBottomCTA>
        {selected.size >= 2 ? (
          <Link href={`/concerns/${concern.id}/compare`} className="w-full no-underline">
            <Button variant="primary" fullWidth size="lg">
              {selected.size}개 제안서 비교하기
              <ArrowRight size={18} />
            </Button>
          </Link>
        ) : (
          <div className="w-full text-center text-[13px] text-[var(--color-text-dim)] py-1">
            {selected.size === 0
              ? '제안서를 선택해 비교해보세요'
              : `${selected.size}개 선택됨 — 1개 더 선택하면 비교할 수 있어요`}
          </div>
        )}
      </MobileBottomCTA>
    </>
  );
}

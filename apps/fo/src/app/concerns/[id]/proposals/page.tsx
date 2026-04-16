'use client';

import Link from 'next/link';
import { MOCK_CONCERNS, MOCK_PROPOSALS, MOCK_PROPOSAL_ITEMS, MOCK_PARTNER_PROFILES, track } from '@hyliren/shared';
import { Button, Badge, MobileBottomCTA } from '@hyliren/ui';
import { ArrowRight, Sparkles } from 'lucide-react';
import { ExperienceCard } from '@/components/common/ExperienceCard';
import { VALUE_PROPS, CARD_GRADIENTS as GRADIENTS } from '@/lib/constants';
import { useDecisionStore } from '@/store/decision';
import { useLocaleStore } from '@/store/locale';
import { use } from 'react';

interface Props { params: Promise<{ id: string }>; }

export default function ProposalListPage({ params }: Props) {
  const { id } = use(params);
  const concern = MOCK_CONCERNS.find(c => c.id === id);
  const t = useLocaleStore(s => s.t);
  if (!concern) {
    return <div className="p-8 text-center text-[var(--color-text-secondary)]">{t('concern.notFound')}</div>;
  }
  const proposals = MOCK_PROPOSALS
    .filter(p => p.concernId === concern.id && p.isActive && p.status !== 'draft')
    .sort((a, b) => a.totalPrice - b.totalPrice);

  const { selectedProposalIds: selected, toggleSelect } = useDecisionStore();

  return (
    <>
      <div className="pb-4">
        {/* ── Header ── */}
        <div className="px-5 pt-7 pb-5">
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="info" size="sm">{concern.primaryArea}</Badge>
            {concern.bodyAreaDetail && (
              <span className="text-[13px] text-[var(--color-text-secondary)]">{concern.bodyAreaDetail}</span>
            )}
          </div>
          <h1 className="text-[1.5rem] font-bold text-[var(--color-text)] leading-tight">
            {t('proposal.list.title', { count: proposals.length })}
          </h1>
          <p className="text-[13px] text-[var(--color-text-secondary)] mt-1.5">
            {t('proposal.list.subtitle')}
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
                unread={!proposal.viewedAt}
              />
            );
          })}
        </div>

        {/* Analysis nudge */}
        <Link href={`/concerns/${concern.id}/compare`} className="no-underline block mt-5"
          onClick={() => track({ eventType: 'report_cta_clicked', actorType: 'user', targetType: 'concern', targetId: concern.id, metadata: { source: 'fo', locale: 'ko', label: 'proposal_list' } })}>
          <div className="flex items-center gap-3 px-4 py-3.5 rounded-2xl bg-gradient-to-r from-[var(--color-primary-soft)] to-[#fff5f7]">
            <Sparkles size={18} className="text-[var(--color-primary)] shrink-0" />
            <div className="flex-1">
              <span className="text-[13px] font-semibold text-[var(--color-text)] block">{t('proposal.list.analysisCta')}</span>
              <span className="text-[11px] text-[var(--color-text-dim)]">{t('proposal.list.analysisDesc')}</span>
            </div>
            <ArrowRight size={16} className="text-[var(--color-primary)]" />
          </div>
        </Link>

        <div className="h-24" />
      </div>

      {/* ── Sticky Bottom CTA ── */}
      <MobileBottomCTA>
        {selected.size >= 2 ? (
          <Link href={`/concerns/${concern.id}/compare`} className="w-full no-underline">
            <Button variant="primary" fullWidth size="lg">
              {t('proposal.list.compareButton', { count: selected.size })}
              <ArrowRight size={18} />
            </Button>
          </Link>
        ) : (
          <div className="w-full text-center text-[13px] text-[var(--color-text-dim)] py-1">
            {selected.size === 0
              ? t('decision.selectToCompare')
              : t('decision.selectedNeedMore', { count: selected.size })}
          </div>
        )}
      </MobileBottomCTA>
    </>
  );
}

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { Concern, Proposal, PartnerProfile, ProposalItem } from '@hyliren/shared';
import { track } from '@hyliren/shared';
import { Button } from '@hyliren/ui';
import { ArrowRight, Sparkles, Plus } from 'lucide-react';
import { ProposalGroupSection } from './ProposalGroupSection';
import { StickyBottomBar } from './StickyBottomBar';
import { ProposalDetailSheet } from './ProposalDetailSheet';
import { SingleAnalysisPreview } from './SingleAnalysisPreview';
import { CompareIntentModal } from './CompareIntentModal';
import { useDecisionStore } from '@/store/decision';
import { useLocaleStore } from '@/store/locale';
import { useAuthStore } from '@/store/auth';
import { useUserConcernsStore } from '@/store/user-concerns';

interface ProposalGroup {
  concern: Concern;
  proposals: Proposal[];
}

interface Props {
  groups: ProposalGroup[];
  profiles: PartnerProfile[];
  items: ProposalItem[];
  totalProposalCount: number;
}

export function DecisionPageClient({ groups, profiles, items, totalProposalCount }: Props) {
  const t = useLocaleStore(s => s.t);
  const userId = useAuthStore(s => s.user?.id) ?? 'u-001';
  const localConcerns = useUserConcernsStore(s => s.concerns);
  const localConcernIds = new Set(localConcerns.map(c => c.id));

  // 내 고민에 연결된 그룹만 표시
  const myGroups = groups.filter(g =>
    g.concern.userId === userId || localConcernIds.has(g.concern.id)
  );

  useEffect(() => {
    track({ eventType: 'decision_page_viewed', actorType: 'user', metadata: { source: 'fo', locale: 'ko', value: String(totalProposalCount) } });
  }, [totalProposalCount]);

  const primaryConcernId = myGroups[0]?.concern.id || '';
  const allProposals = myGroups.flatMap(g => g.proposals);

  /* ── Sheet state ── */
  const [detailProposalId, setDetailProposalId] = useState<string | null>(null);
  const [analysisProposalId, setAnalysisProposalId] = useState<string | null>(null);
  const [showCompareIntent, setShowCompareIntent] = useState(false);
  /** 비교 의도 모달에서 리포트로 넘길 때 사용할 proposal ID */
  const [compareIntentProposalId, setCompareIntentProposalId] = useState<string | null>(null);

  const detailProposal = detailProposalId ? allProposals.find(p => p.id === detailProposalId) : null;
  const analysisProposal = analysisProposalId ? allProposals.find(p => p.id === analysisProposalId) : null;

  function handleCardClick(proposalId: string) {
    setDetailProposalId(proposalId);
    // 읽음 상태 갱신
    const proposal = allProposals.find(p => p.id === proposalId);
    if (proposal && !proposal.viewedAt) {
      fetch('/api/proposals', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: proposalId, viewedAt: new Date().toISOString() }),
      }).catch(() => {});
    }
  }

  function handleCompareIntent(proposalId: string) {
    setDetailProposalId(null);
    setCompareIntentProposalId(proposalId);
    setShowCompareIntent(true);
    track({ eventType: 'compare_intent_clicked', actorType: 'user', targetType: 'proposal', targetId: proposalId,
      metadata: { source: 'fo', locale: 'ko' } });
  }

  function handleCompareIntentProceed() {
    const targetId = compareIntentProposalId
      || [...useDecisionStore.getState().selectedProposalIds][0]
      || allProposals[0]?.id;
    if (targetId) {
      handleAnalyze(targetId);
    }
  }

  function handleAnalyze(proposalId: string) {
    setDetailProposalId(null);
    setShowCompareIntent(false);
    setAnalysisProposalId(proposalId);
    track({ eventType: 'analysis_clicked', actorType: 'user', targetType: 'proposal', targetId: proposalId,
      metadata: { source: 'fo', locale: 'ko' } });
  }

  // Empty state
  if (myGroups.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center px-5 pt-16 pb-10">
        <div className="w-16 h-16 rounded-full bg-[var(--color-bg-secondary)] flex items-center justify-center mb-5">
          <Sparkles size={24} className="text-[var(--color-text-dim)]" />
        </div>
        <h2 className="text-[1.25rem] font-bold text-[var(--color-text)] mb-2">{t('decision.emptyTitle')}</h2>
        <p className="text-[13px] text-[var(--color-text-dim)] text-center leading-relaxed whitespace-pre-line mb-6">
          {t('decision.emptyDesc')}
        </p>
        <Link href="/consult" className="no-underline">
          <Button variant="accent" size="lg">
            {t('decision.emptyCta')}
            <ArrowRight size={18} />
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col px-5 pt-5 pb-28">
        {/* Hero */}
        <div className="mb-5">
          <h1 className="text-[1.25rem] font-bold text-[var(--color-text)] leading-tight whitespace-pre-line mb-1">
            {t('decision.heroTitle', { count: totalProposalCount })}
          </h1>
          <p className="text-[12px] text-[var(--color-text-dim)]">
            {t('decision.heroDesc')}
          </p>
        </div>

        {/* Proposal groups */}
        {myGroups.map(g => (
          <ProposalGroupSection
            key={g.concern.id}
            concern={g.concern}
            proposals={g.proposals}
            profiles={profiles}
            items={items}
            onCardClick={handleCardClick}
          />
        ))}

        {/* Re-entry */}
        <Link href="/consult" className="no-underline block mt-2">
          <div className="flex items-center gap-3 px-4 py-4 rounded-2xl fo-gradient-accent">
            <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shrink-0">
              <Plus size={16} className="text-[var(--color-primary)]" />
            </div>
            <div className="flex-1">
              <span className="text-[13px] font-semibold text-[var(--color-text)] block">{t('decision.addConcern')}</span>
              <span className="text-[11px] text-[var(--color-text-dim)]">다른 부위도 함께 상담받아보세요</span>
            </div>
            <ArrowRight size={16} className="text-[var(--color-text-dim)]" />
          </div>
        </Link>

        {/* Sticky CTA */}
        <StickyBottomBar onCompareClick={() => setShowCompareIntent(true)} onAnalyzeClick={handleAnalyze} />
      </div>

      {/* ── Sheets ── */}

      {/* Proposal Detail */}
      {detailProposal && (
        <ProposalDetailSheet
          proposal={detailProposal}
          profile={profiles.find(p => p.memberId === detailProposal.memberId)}
          items={items.filter(i => i.proposalId === detailProposal.id)}
          onClose={() => setDetailProposalId(null)}
          onAnalyze={() => handleAnalyze(detailProposal.id)}
        />
      )}

      {/* Analysis Preview */}
      {analysisProposal && (
        <SingleAnalysisPreview
          proposal={analysisProposal}
          profile={profiles.find(p => p.memberId === analysisProposal.memberId)}
          onClose={() => setAnalysisProposalId(null)}
        />
      )}

      {/* Compare Intent Modal */}
      {showCompareIntent && (
        <CompareIntentModal
          prices={allProposals.map(p => p.totalPrice)}
          hospitalNames={allProposals.map(p => profiles.find(pp => pp.memberId === p.memberId)?.hospitalName || '')}
          onClose={() => setShowCompareIntent(false)}
          onProceedToReport={handleCompareIntentProceed}
        />
      )}

    </>
  );
}

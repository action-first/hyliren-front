'use client';

import { useCallback, useEffect, useState } from 'react';
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
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { AuthModal } from '@/components/auth/AuthModal';

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
  const [showAuth, setShowAuth] = useState(false);
  useRequireAuth(useCallback(() => setShowAuth(true), []));

  // 서버 (`/api/v1/concerns`) 가 이미 인증된 user 의 concerns 만 반환하므로
  // 클라이언트에서 다시 userId 로 필터링할 필요 없음.
  // 기존 `g.concern.userId === userId` 체크는 list wire 에 userId 필드가 없어서
  // mapConcernListItem 이 userId:'' 로 매핑 → 항상 false → 제안서 안 보이던 버그의 원인.
  const myGroups = groups;

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

      {/* Auth Gate */}
      <AuthModal open={showAuth} onSuccess={() => setShowAuth(false)} onClose={() => setShowAuth(false)} />

    </>
  );
}

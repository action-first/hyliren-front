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
import { ReportPaywall } from './ReportPaywall';
import { useReportStore } from '@/store/report';

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
  const { setActiveProposal } = useReportStore();

  useEffect(() => {
    track({ eventType: 'decision_page_viewed', actorType: 'user', metadata: { source: 'fo', locale: 'ko', value: String(totalProposalCount) } });
  }, [totalProposalCount]);

  const primaryConcernId = groups[0]?.concern.id || '';
  const allProposals = groups.flatMap(g => g.proposals);

  /* ── Sheet state ── */
  const [detailProposalId, setDetailProposalId] = useState<string | null>(null);
  const [analysisProposalId, setAnalysisProposalId] = useState<string | null>(null);

  const detailProposal = detailProposalId ? allProposals.find(p => p.id === detailProposalId) : null;
  const analysisProposal = analysisProposalId ? allProposals.find(p => p.id === analysisProposalId) : null;

  function handleCardClick(proposalId: string) {
    setDetailProposalId(proposalId);
  }

  function handleAnalyze(proposalId: string) {
    setDetailProposalId(null);
    setActiveProposal(proposalId);
    setAnalysisProposalId(proposalId);
    track({ eventType: 'analysis_clicked', actorType: 'user', targetType: 'proposal', targetId: proposalId,
      metadata: { source: 'fo', locale: 'ko' } });
  }

  // Empty state
  if (groups.length === 0 || totalProposalCount === 0) {
    return (
      <div className="flex flex-col items-center justify-center px-5 pt-16 pb-10">
        <div className="w-16 h-16 rounded-full bg-[var(--color-bg-secondary)] flex items-center justify-center mb-5">
          <Sparkles size={24} className="text-[var(--color-text-dim)]" />
        </div>
        <h2 className="text-[1.25rem] font-bold text-[var(--color-text)] mb-2">아직 도착한 제안이 없어요</h2>
        <p className="text-[13px] text-[var(--color-text-dim)] text-center leading-relaxed mb-6">
          고민을 등록하면 병원이 맞춤 제안서를 보내드립니다<br />
          보통 24~48시간 내 도착해요
        </p>
        <Link href="/consult" className="no-underline">
          <Button variant="accent" size="lg">
            고민 상담 시작하기
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
        <div className="mb-6">
          <h1 className="text-[1.5rem] font-bold text-[var(--color-text)] leading-tight mb-1.5">
            {totalProposalCount}개 병원이<br />답변했습니다
          </h1>
          <p className="text-[13px] text-[var(--color-text-dim)]">
            제안을 탭해서 분석하고, 가장 합리적인 선택을 하세요
          </p>
        </div>

        {/* Proposal groups */}
        {groups.map(g => (
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
        <div className="flex items-center gap-3 px-4 py-3.5 rounded-2xl bg-[var(--color-bg-secondary)] mt-2">
          <Plus size={16} className="text-[var(--color-text-dim)]" />
          <span className="text-[13px] text-[var(--color-text-secondary)] flex-1">다른 부위도 함께 상담받아보세요</span>
          <Link href="/consult" className="no-underline">
            <Button variant="ghost" size="sm">등록하기</Button>
          </Link>
        </div>

        {/* Sticky CTA */}
        <StickyBottomBar primaryConcernId={primaryConcernId} />
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

      {/* Paywall */}
      <ReportPaywall />
    </>
  );
}

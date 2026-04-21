'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import type { Proposal } from '@hyliren/shared';
import { MOCK_CONCERNS, MOCK_PROPOSALS, track } from '@hyliren/shared';
import { useUserConcernsStore } from '@/store/user-concerns';
import { Button, Badge } from '@hyliren/ui';
import {
  ArrowRight, Plus, FileText, Clock, ChevronRight,
  BookOpen, MessageCircle, Inbox, Scale, Banknote, Calendar,
} from 'lucide-react';
import { ARTICLES } from '@/lib/articles-data';

import { AREA_ACCENT, getAreaBar } from '@/lib/area-styles';
import {
  type DashboardState,
  computeDashboardState, computeConcernActions,
  getRecommendedArticles, STATUS_LABELS, STATUS_COLORS,
} from '@/domain/lifecycle';
import { useLocaleStore } from '@/store/locale';
import { useAuthStore } from '@/store/auth';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { AuthModal } from '@/components/auth/AuthModal';

export default function DashboardPage() {
  const t = useLocaleStore(s => s.t);
  const userId = useAuthStore(s => s.user?.id) ?? 'u-001';
  const [showAuth, setShowAuth] = useState(false);
  useRequireAuth(useCallback(() => setShowAuth(true), []));
  const userCreatedConcerns = useUserConcernsStore(s => s.concerns);
  const userConcerns = [
    ...MOCK_CONCERNS.filter(c => c.userId === userId && !c.deletedAt),
    ...userCreatedConcerns,
  ];

  const [realProposals, setRealProposals] = useState<Proposal[] | null>(null);
  useEffect(() => {
    fetch(`/api/proposals?userId=${userId}`)
      .then(r => r.json())
      .then(d => setRealProposals(d.proposals ?? []))
      .catch(() => setRealProposals([]));
  }, [userId]);

  const userProposals = realProposals ?? MOCK_PROPOSALS.filter(p => p.isActive);
  const dashboard = computeDashboardState(userConcerns, userProposals);

  useEffect(() => {
    track({ eventType: 'dashboard_viewed', actorType: 'user', targetType: 'user', targetId: userId, metadata: { source: 'fo', locale: 'ko', value: dashboard.phase } });
  }, [dashboard.phase]);

  return (
    <>
    <AuthModal open={showAuth} onSuccess={() => setShowAuth(false)} onClose={() => setShowAuth(false)} />
    <div className="flex flex-col px-5 pt-5 pb-10">

      {/* ═══ HERO ═══ */}
      <DashboardHero phase={dashboard.phase} state={dashboard} />

      {/* ═══ 내 고민 ═══ */}
      {dashboard.hasConcern && (
        <section className="mt-7">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[1.0625rem] font-bold text-[var(--color-text)]">{t('dashboard.myConcerns')}</h2>
            <span className="text-[11px] text-[var(--color-text-dim)]">{dashboard.activeConcernCount}{t('common.items')}</span>
          </div>
          <div className="flex flex-col gap-3">
            {userConcerns
              .filter(c => c.status !== 'cancelled')
              .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
              .map(concern => {
                const actions = computeConcernActions(concern, userProposals);
                const proposalCount = userProposals.filter(p => p.concernId === concern.id).length;
                return (
                  <ConcernStatusCard
                    key={concern.id}
                    concernId={concern.id}
                    bodyAreas={concern.bodyAreas}
                    description={concern.description}
                    status={concern.status}
                    proposalCount={proposalCount}
                    hasNewProposal={actions.hasNewProposal}
                    budgetMin={concern.budgetMin}
                    budgetMax={concern.budgetMax}
                    visitDateFrom={concern.visitDateFrom}
                  />
                );
              })}
          </div>
        </section>
      )}

      {/* ═══ 대기 중 패널 ═══ */}
      {dashboard.phase === 'waiting' && (
        <WaitingStatePanel bodyArea={dashboard.primaryConcern?.primaryArea || t('bodyArea.기타')} />
      )}

      {/* ═══ 맞춤 추천 정보 ═══ */}
      {dashboard.hasConcern && dashboard.primaryConcern && (
        <RecommendedArticlesSection
          bodyArea={dashboard.primaryConcern.primaryArea}
          status={dashboard.primaryConcern.status}
        />
      )}

      {/* ═══ 재진입 CTA ═══ */}
      {dashboard.hasConcern && (
        <ReEntryCTA />
      )}
    </div>
    </>
  );
}

/* ════════════════════════════════════════════════
   Components
   ════════════════════════════════════════════════ */

function DashboardHero({ phase, state }: { phase: string; state: DashboardState }) {
  const t = useLocaleStore(s => s.t);
  const configs: Record<string, { title: string; subtitle: string; cta: string; ctaHref: string; gradient: string }> = {
    empty: {
      title: t('dashboard.emptyTitle'),
      subtitle: t('dashboard.emptyDesc'),
      cta: t('dashboard.emptyAction'),
      ctaHref: '/consult',
      gradient: 'from-[var(--color-bg-wash)] via-white to-white',
    },
    waiting: {
      title: t('dashboard.waitingPhaseTitle', { count: state.waitingProposalCount }),
      subtitle: t('dashboard.waitingPhaseDesc'),
      cta: t('dashboard.waitingPhaseAction'),
      ctaHref: state.primaryConcern ? `/concerns/${state.primaryConcern.id}` : '/consult',
      gradient: 'from-[#fff8e1] via-white to-white',
    },
    proposals_arrived: {
      title: t('dashboard.arrivedPhaseTitle'),
      subtitle: t('dashboard.arrivedPhaseDesc', { count: state.unreadProposalCount }),
      cta: t('dashboard.arrivedPhaseAction'),
      ctaHref: state.primaryConcern ? `/concerns/${state.primaryConcern.id}/proposals` : '/decision',
      gradient: 'from-[#e8f5e9] via-white to-white',
    },
    comparing: {
      title: t('dashboard.comparingPhaseTitle'),
      subtitle: t('dashboard.comparingPhaseDesc'),
      cta: t('dashboard.comparingPhaseAction'),
      ctaHref: '/decision',
      gradient: 'from-[#e3f2fd] via-white to-white',
    },
    selected: {
      title: t('dashboard.selectedPhaseTitle'),
      subtitle: t('dashboard.selectedPhaseDesc'),
      cta: t('dashboard.selectedPhaseAction'),
      ctaHref: state.primaryConcern ? `/concerns/${state.primaryConcern.id}` : '/consult',
      gradient: 'from-[#f3e5f5] via-white to-white',
    },
    completed: {
      title: t('dashboard.completedPhaseTitle'),
      subtitle: t('dashboard.completedPhaseDesc'),
      cta: t('dashboard.completedPhaseAction'),
      ctaHref: '/consult',
      gradient: 'from-[#e8f5e9] via-white to-white',
    },
  };

  const config = configs[phase] || configs.empty;

  return (
    <div className={`relative rounded-2xl overflow-hidden px-5 pt-5 pb-5 bg-gradient-to-b ${config.gradient}`}>
      <h1 className="text-[1.25rem] font-bold text-[var(--color-text)] leading-tight whitespace-pre-line mb-1">
        {config.title}
      </h1>
      <p className="text-[12px] text-[var(--color-text-dim)] leading-relaxed mb-4">
        {config.subtitle}
      </p>
      <Link href={config.ctaHref} className="no-underline">
        <Button variant="accent" size="xl" fullWidth>
          {config.cta}
          <ArrowRight size={16} />
        </Button>
      </Link>
    </div>
  );
}

function ConcernStatusCard({
  concernId, bodyAreas, description, status, proposalCount, hasNewProposal,
  budgetMin, budgetMax, visitDateFrom,
}: {
  concernId: string;
  bodyAreas: string[];
  description: string;
  status: string;
  proposalCount: number;
  hasNewProposal: boolean;
  budgetMin?: number | null;
  budgetMax?: number | null;
  visitDateFrom?: string | null;
}) {
  const t = useLocaleStore(s => s.t);
  const hasProposals = proposalCount > 0 && (status === 'proposal_received' || status === 'comparing' || status === 'report_purchased');
  const href = hasProposals ? '/decision' : `/concerns/${concernId}`;
  const statusIcon = hasProposals ? Scale : status === 'submitted' ? Clock : FileText;
  const Icon = statusIcon;

  return (
    <Link href={href} className="no-underline block">
      <div className="rounded-2xl bg-white px-4 py-4"
        style={{ boxShadow: 'var(--app-shadow-card-sm)' }}>
        {/* 1행: bodyArea 컬러 뱃지 + 상태 + NEW */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            {bodyAreas.map(area => (
              <span key={area} className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${AREA_ACCENT[area] || 'bg-gray-50 text-gray-600'}`}>
                {area}
              </span>
            ))}
          </div>
          <div className="flex items-center gap-1.5">
            {hasNewProposal && (
              <span className="px-1.5 py-0.5 rounded bg-[var(--color-primary)] text-[8px] font-bold text-white">
                NEW
              </span>
            )}
            <Badge variant={STATUS_COLORS[status] || 'default'} size="sm">
              {STATUS_LABELS[status] || status}
            </Badge>
          </div>
        </div>

        {/* 2행: 설명 */}
        <p className="text-[13px] text-[var(--color-text-secondary)] leading-snug line-clamp-2 mb-2">
          {description}
        </p>

        {/* 3행: 예산/방문 칩 */}
        {(budgetMin || visitDateFrom) && (
          <div className="flex items-center gap-2 mb-2.5">
            {budgetMin && budgetMax && (
              <span className="flex items-center gap-0.5 px-2 py-0.5 rounded-md bg-[var(--color-bg-secondary)] text-[10px] font-medium text-[var(--color-text-dim)]">
                <Banknote size={10} /> {budgetMin}~{budgetMax}만
              </span>
            )}
            {visitDateFrom && (
              <span className="flex items-center gap-0.5 px-2 py-0.5 rounded-md bg-[var(--color-bg-secondary)] text-[10px] font-medium text-[var(--color-text-dim)]">
                <Calendar size={10} /> {visitDateFrom.slice(5)}~
              </span>
            )}
          </div>
        )}

        {/* 4행: 상태 액션 */}
        <div className="flex items-center justify-between pt-2.5 border-t border-[var(--color-border-light)]">
          <div className="flex items-center gap-1.5 text-[11px] text-[var(--color-text-dim)]">
            <Icon size={13} />
            {status === 'submitted' && t('dashboard.hospitalReviewing')}
            {status === 'proposal_received' && t('dashboard.proposalsArrived', { count: proposalCount })}
            {status === 'comparing' && t('dashboard.comparing', { count: proposalCount })}
            {status === 'hospital_selected' && t('dashboard.hospitalSelected')}
            {status === 'completed' && t('dashboard.procedureCompleted')}
            {status === 'draft' && t('dashboard.writing')}
          </div>
          <div className="flex items-center gap-0.5 text-[12px] font-semibold text-[var(--color-primary)]">
            {hasProposals ? t('dashboard.checkInDecision') : t('common.viewDetails')}
            <ChevronRight size={14} />
          </div>
        </div>
      </div>
    </Link>
  );
}

function WaitingStatePanel({ bodyArea }: { bodyArea: string }) {
  const t = useLocaleStore(s => s.t);
  const waitUserId = useAuthStore(s => s.user?.id) ?? 'u-001';
  useEffect(() => {
    track({ eventType: 'waiting_panel_viewed', actorType: 'user', targetType: 'user', targetId: waitUserId, metadata: { source: 'fo', locale: 'ko' } });
  }, []);

  return (
    <section className="mt-7">
      <div className="rounded-2xl bg-[var(--color-bg-secondary)] px-5 py-5">
        <div className="flex items-center gap-2 mb-3">
          <Clock size={16} className="text-[var(--color-primary)]" />
          <span className="text-[14px] font-semibold text-[var(--color-text)]">{t('dashboard.waitingTitle')}</span>
        </div>
        <p className="text-[13px] text-[var(--color-text-dim)] leading-relaxed mb-4">
          {t('dashboard.waitingDesc')}<br />
          {t('dashboard.waitingHint')}
        </p>
        <div className="flex flex-col gap-2">
          <Link href="/consult" className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-white no-underline"
            style={{ boxShadow: 'var(--app-shadow-card-xs)' }}>
            <Plus size={16} className="text-[var(--color-primary)]" />
            <span className="text-[13px] font-medium text-[var(--color-text)]">{t('dashboard.addAnother')}</span>
          </Link>
          <Link href="/articles" className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-white no-underline"
            style={{ boxShadow: 'var(--app-shadow-card-xs)' }}>
            <BookOpen size={16} className="text-[var(--color-text-dim)]" />
            <span className="text-[13px] font-medium text-[var(--color-text)]">{t('dashboard.readInfo')}</span>
          </Link>
        </div>
      </div>
    </section>
  );
}

function RecommendedArticlesSection({ bodyArea, status }: { bodyArea: string; status: string }) {
  const t = useLocaleStore(s => s.t);

  // 실제 아티클 데이터에서 bodyArea 매칭 우선, 없으면 전체에서 3개
  const matched = ARTICLES.filter(a => a.bodyArea === bodyArea || a.bodyArea === '전체').slice(0, 3);
  const displayArticles = matched.length > 0 ? matched : ARTICLES.slice(0, 3);

  return (
    <section className="mt-7">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-[1.0625rem] font-bold text-[var(--color-text)]">{t('dashboard.recommendedInfo')}</h2>
        <Link href="/articles" className="flex items-center gap-0.5 text-[11px] text-[var(--color-text-dim)] no-underline">
          {t('common.seeMore')} <ChevronRight size={14} />
        </Link>
      </div>
      <div className="flex flex-col gap-2.5">
        {displayArticles.map(a => (
          <Link key={a.id} href={`/articles/${a.slug}`} className="flex gap-3 p-3 rounded-xl bg-white no-underline"
            style={{ boxShadow: 'var(--app-shadow-card-sm)' }}>
            <div className="w-14 h-14 rounded-lg overflow-hidden shrink-0 relative">
              <img src={a.heroImage} alt={a.title} className="w-full h-full object-cover" />
              <div className={`absolute bottom-0 left-0 right-0 h-1 ${
                getAreaBar(a.bodyArea)
              }`} />
            </div>
            <div className="flex flex-col gap-1 justify-center min-w-0">
              <Badge variant={a.tagColor} size="sm">{a.category}</Badge>
              <span className="text-[13px] font-medium text-[var(--color-text)] leading-snug line-clamp-2">{a.title}</span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

function ReEntryCTA() {
  const t = useLocaleStore(s => s.t);
  return (
    <section className="mt-7">
      <Link href="/consult" className="no-underline block">
        <div className="flex items-center gap-3 px-4 py-4 rounded-2xl fo-gradient-accent">
          <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shrink-0">
            <Plus size={16} className="text-[var(--color-primary)]" />
          </div>
          <div className="flex-1">
            <span className="text-[13px] font-semibold text-[var(--color-text)] block">{t('dashboard.otherAreaQuestion')}</span>
            <span className="text-[11px] text-[var(--color-text-dim)]">{t('dashboard.otherAreaHint')}</span>
          </div>
          <ArrowRight size={16} className="text-[var(--color-text-dim)]" />
        </div>
      </Link>
    </section>
  );
}

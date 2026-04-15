'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { MOCK_CONCERNS, MOCK_PROPOSALS, track } from '@hyliren/shared';
import { useUserConcernsStore } from '@/store/user-concerns';
import { Button, Badge } from '@hyliren/ui';
import {
  ArrowRight, Plus, FileText, Clock, ChevronRight,
  BookOpen, MessageCircle, Inbox, Scale,
} from 'lucide-react';
import {
  type DashboardState,
  computeDashboardState, computeConcernActions,
  getRecommendedArticles, STATUS_LABELS, STATUS_COLORS,
} from '@/domain/lifecycle';
import { useLocaleStore } from '@/store/locale';

const USER_ID = 'u-001';

export default function DashboardPage() {
  const t = useLocaleStore(s => s.t);
  const userCreatedConcerns = useUserConcernsStore(s => s.concerns);
  const userConcerns = [
    ...MOCK_CONCERNS.filter(c => c.userId === USER_ID && !c.deletedAt),
    ...userCreatedConcerns,
  ];
  const userProposals = MOCK_PROPOSALS.filter(p => p.isActive);
  const dashboard = computeDashboardState(userConcerns, userProposals);

  useEffect(() => {
    track({ eventType: 'dashboard_viewed', actorType: 'user', targetType: 'user', targetId: USER_ID, metadata: { source: 'fo', locale: 'ko', value: dashboard.phase } });
  }, [dashboard.phase]);

  return (
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
      gradient: 'from-[#fff5f7] via-white to-white',
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
      ctaHref: '/decision',
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
    <div className={`relative rounded-2xl overflow-hidden px-5 pt-7 pb-6 bg-gradient-to-b ${config.gradient}`}>
      <h1 className="text-[1.5rem] font-bold text-[var(--color-text)] leading-tight whitespace-pre-line mb-2">
        {config.title}
      </h1>
      <p className="text-[13px] text-[var(--color-text-dim)] leading-relaxed mb-5">
        {config.subtitle}
      </p>
      <Link href={config.ctaHref} className="no-underline">
        <Button variant="accent" size="lg" fullWidth>
          {config.cta}
          <ArrowRight size={18} />
        </Button>
      </Link>
    </div>
  );
}

function ConcernStatusCard({
  concernId, bodyAreas, description, status, proposalCount, hasNewProposal,
}: {
  concernId: string;
  bodyAreas: string[];
  description: string;
  status: string;
  proposalCount: number;
  hasNewProposal: boolean;
}) {
  const t = useLocaleStore(s => s.t);
  // 상태에 따라 CTA 결정: 제안 도착 → 결정함, 그 외 → 고민 상세
  const hasProposals = proposalCount > 0 && (status === 'proposal_received' || status === 'comparing' || status === 'report_purchased');
  const href = hasProposals ? '/decision' : `/concerns/${concernId}`;
  const statusIcon = hasProposals ? Scale : status === 'submitted' ? Clock : FileText;
  const Icon = statusIcon;

  return (
    <Link href={href} className="no-underline block">
      <div className="rounded-2xl bg-white px-4 py-4"
        style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
        {/* Top: tags + status */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            {bodyAreas.map(area => (
              <Badge key={area} variant="info" size="sm">{area}</Badge>
            ))}
          </div>
          <div className="flex items-center gap-1.5">
            {hasNewProposal && <span className="w-2 h-2 rounded-full bg-[var(--color-primary)]" />}
            <Badge variant={STATUS_COLORS[status] || 'default'} size="sm">
              {STATUS_LABELS[status] || status}
            </Badge>
          </div>
        </div>

        {/* Description */}
        <p className="text-[13px] text-[var(--color-text)] leading-snug line-clamp-2 mb-3">
          {description}
        </p>

        {/* Bottom: action */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-[11px] text-[var(--color-text-dim)]">
            <Icon size={13} />
            {status === 'submitted' && t('dashboard.hospitalReviewing')}
            {status === 'proposal_received' && t('dashboard.proposalsArrived', { count: proposalCount })}
            {status === 'comparing' && t('dashboard.comparing', { count: proposalCount })}
            {status === 'hospital_selected' && t('dashboard.hospitalSelected')}
            {status === 'completed' && t('dashboard.procedureCompleted')}
            {status === 'draft' && t('dashboard.writing')}
          </div>
          <div className="flex items-center gap-0.5 text-[12px] font-medium text-[var(--color-primary)]">
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
  useEffect(() => {
    track({ eventType: 'waiting_panel_viewed', actorType: 'user', targetType: 'user', targetId: USER_ID, metadata: { source: 'fo', locale: 'ko' } });
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
            style={{ boxShadow: '0 0 0 1px rgba(0,0,0,0.04)' }}>
            <Plus size={16} className="text-[var(--color-primary)]" />
            <span className="text-[13px] font-medium text-[var(--color-text)]">{t('dashboard.addAnother')}</span>
          </Link>
          <Link href="/articles" className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-white no-underline"
            style={{ boxShadow: '0 0 0 1px rgba(0,0,0,0.04)' }}>
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
  const articles = getRecommendedArticles(bodyArea, status);

  return (
    <section className="mt-7">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-[1.0625rem] font-bold text-[var(--color-text)]">{t('dashboard.recommendedInfo')}</h2>
        <Link href="/articles" className="flex items-center gap-0.5 text-[11px] text-[var(--color-text-dim)] no-underline">
          {t('common.seeMore')} <ChevronRight size={14} />
        </Link>
      </div>
      <div className="flex flex-col gap-2.5">
        {articles.map((a, i) => (
          <Link key={i} href="/articles" className="flex gap-3 p-3 rounded-xl bg-white no-underline"
            style={{ boxShadow: '0 0 0 1px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.04)' }}>
            <div className="w-14 h-14 rounded-lg overflow-hidden shrink-0">
              <div className={`w-full h-full bg-gradient-to-br ${a.gradient}`} />
            </div>
            <div className="flex flex-col gap-1 justify-center min-w-0">
              <Badge variant={a.tagColor} size="sm">{a.tag}</Badge>
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
    <section className="mt-8">
      <div className="flex flex-col items-center gap-3 px-5 py-5 rounded-2xl bg-[var(--color-bg-secondary)]">
        <MessageCircle size={24} className="text-[var(--color-text-dim)]" />
        <p className="text-[13px] text-[var(--color-text-secondary)] text-center leading-relaxed">
          {t('dashboard.otherAreaQuestion')}<br />
          {t('dashboard.otherAreaHint')}
        </p>
        <Link href="/consult" className="no-underline">
          <Button variant="secondary" size="md">
            <Plus size={16} />
            {t('dashboard.newConcern')}
          </Button>
        </Link>
      </div>
    </section>
  );
}

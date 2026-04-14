'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { MOCK_CONCERNS, MOCK_PROPOSALS, MOCK_PARTNER_PROFILES, MOCK_PROPOSAL_ITEMS, track } from '@hyliren/shared';
import { Button, Badge } from '@hyliren/ui';
import {
  ArrowRight, Plus, FileText, Clock, Bell, ChevronRight,
  Sparkles, ShieldCheck, BookOpen, MessageCircle,
} from 'lucide-react';
import {
  computeDashboardState, computeConcernActions,
  getRecommendedArticles, STATUS_LABELS, STATUS_COLORS,
} from '@/lib/lifecycle';

/* ── Mock: current user's concerns ── */
const USER_ID = 'u-001';
const userConcerns = MOCK_CONCERNS.filter(c => c.userId === USER_ID && !c.deletedAt);
const userProposals = MOCK_PROPOSALS.filter(p => p.isActive);
const dashboard = computeDashboardState(userConcerns, userProposals);

export default function DashboardPage() {
  useEffect(() => {
    track({ eventType: 'dashboard_viewed', actorType: 'user', targetType: 'user', targetId: USER_ID, metadata: { source: 'fo', locale: 'ko', value: dashboard.phase } });
  }, []);

  return (
    <div className="flex flex-col px-5 pt-5 pb-10">

      {/* ═══ HERO — 상태 기반 ═══ */}
      <DashboardHero phase={dashboard.phase} state={dashboard} />

      {/* ═══ ACTIVE CONCERNS ═══ */}
      {dashboard.hasConcern && (
        <section className="mt-7">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[1.0625rem] font-bold text-[var(--color-text)]">내 고민</h2>
            <span className="text-[11px] text-[var(--color-text-dim)]">{dashboard.activeConcernCount}건</span>
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
                    bodyArea={concern.bodyArea}
                    bodyAreaDetail={concern.bodyAreaDetail}
                    status={concern.status}
                    proposalCount={proposalCount}
                    nextAction={actions.nextAction}
                    nextActionHref={actions.nextActionHref}
                    hasNewProposal={actions.hasNewProposal}
                  />
                );
              })}
          </div>
        </section>
      )}

      {/* ═══ PROPOSAL INBOX PREVIEW ═══ */}
      {dashboard.unreadProposalCount > 0 && (
        <section className="mt-7">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <h2 className="text-[1.0625rem] font-bold text-[var(--color-text)]">새 제안서</h2>
              <span className="w-5 h-5 rounded-full bg-[var(--color-primary)] text-white text-[10px] font-bold flex items-center justify-center">
                {dashboard.unreadProposalCount}
              </span>
            </div>
            <Link href="/proposals" className="flex items-center gap-0.5 text-[11px] text-[var(--color-text-dim)] no-underline">
              전체보기 <ChevronRight size={14} />
            </Link>
          </div>
          <ProposalInboxPreview />
        </section>
      )}

      {/* ═══ WAITING STATE PANEL ═══ */}
      {dashboard.phase === 'waiting' && (
        <WaitingStatePanel bodyArea={dashboard.primaryConcern?.bodyArea || '기타'} />
      )}

      {/* ═══ DECISION ASSIST ═══ */}
      {(dashboard.phase === 'comparing' || dashboard.phase === 'proposals_arrived') && (
        <DecisionAssistCTA />
      )}

      {/* ═══ RECOMMENDED ARTICLES ═══ */}
      {dashboard.hasConcern && dashboard.primaryConcern && (
        <RecommendedArticlesSection
          bodyArea={dashboard.primaryConcern.bodyArea}
          status={dashboard.primaryConcern.status}
        />
      )}

      {/* ═══ RE-ENTRY CTA ═══ */}
      {dashboard.hasConcern && (
        <ReEntryCTA />
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════
   Dashboard Components
   ════════════════════════════════════════════════ */

function DashboardHero({ phase, state }: { phase: string; state: typeof dashboard }) {
  const configs: Record<string, { title: string; subtitle: string; cta: string; ctaHref: string; gradient: string }> = {
    empty: {
      title: '어떤 시술을\n고민하고 계신가요?',
      subtitle: '사진과 고민을 남기면 병원이 맞춤 제안을 보내드려요',
      cta: '고민 등록 시작',
      ctaHref: '/consult',
      gradient: 'from-[#fff5f7] via-white to-white',
    },
    waiting: {
      title: `현재 ${state.waitingProposalCount}건의 고민이\n병원에 전달되었습니다`,
      subtitle: '보통 24~48시간 내 제안이 도착합니다',
      cta: '고민 상세 보기',
      ctaHref: state.primaryConcern ? `/concerns/${state.primaryConcern.id}` : '/concerns',
      gradient: 'from-[#fff8e1] via-white to-white',
    },
    proposals_arrived: {
      title: `새로운 제안서가\n도착했습니다`,
      subtitle: `${state.unreadProposalCount}개 병원의 맞춤 제안을 확인하세요`,
      cta: '제안서 확인하기',
      ctaHref: state.primaryConcern ? `/concerns/${state.primaryConcern.id}/proposals` : '/proposals',
      gradient: 'from-[#e8f5e9] via-white to-white',
    },
    comparing: {
      title: '어떤 선택이 맞을지\n고민 중이신가요?',
      subtitle: '검증 리포트로 더 확실한 판단을 해보세요',
      cta: '비교 계속하기',
      ctaHref: state.primaryConcern ? `/concerns/${state.primaryConcern.id}/compare` : '/proposals',
      gradient: 'from-[#e3f2fd] via-white to-white',
    },
    selected: {
      title: '다음 준비를\n시작해보세요',
      subtitle: '일정, 통역, 픽업 서비스를 확인하세요',
      cta: '서비스 보기',
      ctaHref: state.primaryConcern ? `/concerns/${state.primaryConcern.id}` : '/concerns',
      gradient: 'from-[#f3e5f5] via-white to-white',
    },
    completed: {
      title: '시술이 완료되었어요',
      subtitle: '다른 부위도 고민 중이시라면 상담을 시작해보세요',
      cta: '새 고민 등록',
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
  bodyArea, bodyAreaDetail, status, proposalCount,
  nextAction, nextActionHref, hasNewProposal,
}: {
  bodyArea: string;
  bodyAreaDetail: string | null;
  status: string;
  proposalCount: number;
  nextAction: string;
  nextActionHref: string;
  hasNewProposal: boolean;
}) {
  return (
    <Link href={nextActionHref} className="no-underline block">
      <div className="flex items-center gap-3 px-4 py-3.5 rounded-2xl bg-white"
        style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
        {/* Left indicator */}
        <div className="w-10 h-10 rounded-full bg-[var(--color-primary-soft)] flex items-center justify-center shrink-0">
          <FileText size={18} className="text-[var(--color-primary)]" />
        </div>
        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-[14px] font-semibold text-[var(--color-text)]">{bodyArea}</span>
            {bodyAreaDetail && <span className="text-[12px] text-[var(--color-text-dim)]">{bodyAreaDetail}</span>}
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={STATUS_COLORS[status] || 'default'}>{STATUS_LABELS[status] || status}</Badge>
            {proposalCount > 0 && (
              <span className="text-[11px] text-[var(--color-text-dim)]">제안 {proposalCount}건</span>
            )}
          </div>
        </div>
        {/* Action */}
        <div className="flex items-center gap-1 shrink-0">
          {hasNewProposal && (
            <span className="w-2 h-2 rounded-full bg-[var(--color-primary)]" />
          )}
          <span className="text-[12px] font-medium text-[var(--color-primary)]">{nextAction}</span>
          <ChevronRight size={14} className="text-[var(--color-text-dim)]" />
        </div>
      </div>
    </Link>
  );
}

function ProposalInboxPreview() {
  const unread = MOCK_PROPOSALS.filter(p => p.isActive && p.status === 'sent' && !p.viewedAt).slice(0, 3);

  return (
    <div className="flex flex-col gap-2.5">
      {unread.map(p => {
        const profile = MOCK_PARTNER_PROFILES.find(pp => pp.memberId === p.memberId);
        const concern = MOCK_CONCERNS.find(c => c.id === p.concernId);
        return (
          <Link key={p.id} href={`/concerns/${p.concernId}/proposals`} className="no-underline block">
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white"
              style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
              <div className="w-9 h-9 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
                {profile?.verified ? <ShieldCheck size={16} className="text-emerald-500" /> : <Bell size={16} className="text-[var(--color-text-dim)]" />}
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-[13px] font-medium text-[var(--color-text)] line-clamp-1">{profile?.hospitalName}</span>
                <span className="text-[11px] text-[var(--color-text-dim)]">{concern?.bodyArea} · {p.totalPrice}만원</span>
              </div>
              <span className="text-[12px] font-medium text-[var(--color-primary)]">확인</span>
            </div>
          </Link>
        );
      })}
    </div>
  );
}

function WaitingStatePanel({ bodyArea }: { bodyArea: string }) {
  useEffect(() => {
    track({ eventType: 'waiting_panel_viewed', actorType: 'user', targetType: 'user', targetId: USER_ID, metadata: { source: 'fo', locale: 'ko' } });
  }, []);

  return (
    <section className="mt-7">
      <div className="rounded-2xl bg-[var(--color-bg-secondary)] px-5 py-5">
        <div className="flex items-center gap-2 mb-3">
          <Clock size={16} className="text-[var(--color-primary)]" />
          <span className="text-[14px] font-semibold text-[var(--color-text)]">제안 대기 중</span>
        </div>
        <p className="text-[13px] text-[var(--color-text-dim)] leading-relaxed mb-4">
          병원들이 고민을 검토하고 있어요.<br />
          대기 중에 관련 정보를 확인해보세요.
        </p>
        <div className="flex flex-col gap-2">
          <Link href="/consult" className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-white no-underline"
            style={{ boxShadow: '0 0 0 1px rgba(0,0,0,0.04)' }}
            onClick={() => track({ eventType: 'additional_concern_started', actorType: 'user', targetType: 'user', targetId: USER_ID, metadata: { source: 'fo', locale: 'ko', label: 'waiting_panel' } })}>
            <Plus size={16} className="text-[var(--color-primary)]" />
            <span className="text-[13px] font-medium text-[var(--color-text)]">다른 고민도 등록하기</span>
          </Link>
          <Link href="/articles" className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-white no-underline"
            style={{ boxShadow: '0 0 0 1px rgba(0,0,0,0.04)' }}
            onClick={() => track({ eventType: 'article_clicked_from_dashboard', actorType: 'user', targetType: 'article', targetId: '', metadata: { source: 'fo', locale: 'ko', label: 'waiting_panel' } })}>
            <BookOpen size={16} className="text-[var(--color-text-dim)]" />
            <span className="text-[13px] font-medium text-[var(--color-text)]">{bodyArea} 관련 정보 읽기</span>
          </Link>
        </div>
      </div>
    </section>
  );
}

function DecisionAssistCTA() {
  return (
    <section className="mt-7">
      <div className="rounded-2xl overflow-hidden"
        style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
        <div className="bg-gradient-to-r from-[var(--color-primary-soft)] to-[#fff5f7] px-5 py-4">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles size={16} className="text-[var(--color-primary)]" />
            <span className="text-[14px] font-semibold text-[var(--color-text)]">판단이 어려우신가요?</span>
          </div>
          <p className="text-[12px] text-[var(--color-text-dim)] leading-relaxed mb-3">
            가격 차이가 왜 나는지, 과잉진료는 아닌지<br />
            검증 리포트로 확인해보세요
          </p>
          <Button variant="primary" size="md" fullWidth
            onClick={() => track({ eventType: 'report_cta_clicked', actorType: 'user', targetType: 'user', targetId: USER_ID, metadata: { source: 'fo', locale: 'ko', label: 'dashboard' } })}>
            검증 리포트 알아보기
            <ArrowRight size={16} />
          </Button>
        </div>
      </div>
    </section>
  );
}

function RecommendedArticlesSection({ bodyArea, status }: { bodyArea: string; status: string }) {
  const articles = getRecommendedArticles(bodyArea, status);

  return (
    <section className="mt-7">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-[1.0625rem] font-bold text-[var(--color-text)]">맞춤 추천 정보</h2>
        <Link href="/articles" className="flex items-center gap-0.5 text-[11px] text-[var(--color-text-dim)] no-underline">
          더보기 <ChevronRight size={14} />
        </Link>
      </div>
      <div className="flex flex-col gap-2.5">
        {articles.map((a, i) => (
          <Link key={i} href="/articles" className="flex gap-3 p-3 rounded-xl bg-white no-underline"
            style={{ boxShadow: '0 0 0 1px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.04)' }}
            onClick={() => track({ eventType: 'article_clicked_from_dashboard', actorType: 'user', targetType: 'article', targetId: '', metadata: { source: 'fo', locale: 'ko', label: bodyArea } })}>
            <div className="w-14 h-14 rounded-lg overflow-hidden shrink-0">
              <div className={`w-full h-full bg-gradient-to-br ${a.gradient}`} />
            </div>
            <div className="flex flex-col gap-1 justify-center min-w-0">
              <Badge variant={a.tagColor}>{a.tag}</Badge>
              <span className="text-[13px] font-medium text-[var(--color-text)] leading-snug line-clamp-2">{a.title}</span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

function ReEntryCTA() {
  return (
    <section className="mt-8">
      <div className="flex flex-col items-center gap-3 px-5 py-5 rounded-2xl bg-[var(--color-bg-secondary)]">
        <MessageCircle size={24} className="text-[var(--color-text-dim)]" />
        <p className="text-[13px] text-[var(--color-text-secondary)] text-center leading-relaxed">
          다른 부위도 고민 중이신가요?<br />
          함께 상담하면 더 좋은 제안을 받을 수 있어요
        </p>
        <Link href="/consult" className="no-underline"
          onClick={() => track({ eventType: 'reentry_cta_clicked', actorType: 'user', targetType: 'user', targetId: USER_ID, metadata: { source: 'fo', locale: 'ko', label: 'dashboard' } })}>
          <Button variant="secondary" size="md">
            <Plus size={16} />
            새 고민 등록하기
          </Button>
        </Link>
      </div>
    </section>
  );
}

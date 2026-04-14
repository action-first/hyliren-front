/**
 * Lifecycle State Helpers
 * 사용자 생애주기 상태를 계산하는 순수 함수들
 */
import type { Concern, Proposal } from '@hyliren/shared';

/* ── User Dashboard State ── */

export interface DashboardState {
  hasConcern: boolean;
  activeConcernCount: number;
  waitingProposalCount: number;
  unreadProposalCount: number;
  comparingConcernCount: number;
  completedConcernCount: number;
  /** The most actionable concern */
  primaryConcern: Concern | null;
  /** Current lifecycle phase */
  phase: 'empty' | 'waiting' | 'proposals_arrived' | 'comparing' | 'selected' | 'completed';
}

export function computeDashboardState(concerns: Concern[], proposals: Proposal[]): DashboardState {
  const active = concerns.filter(c => c.status !== 'draft' && c.status !== 'cancelled' && !c.deletedAt);
  const waiting = active.filter(c => c.status === 'submitted');
  const withProposals = active.filter(c => c.status === 'proposal_received');
  const comparing = active.filter(c => c.status === 'comparing');
  const selected = active.filter(c => c.status === 'hospital_selected' || c.status === 'service_purchased');
  const completed = active.filter(c => c.status === 'completed');

  const unreadProposals = proposals.filter(p => p.isActive && p.status === 'sent' && !p.viewedAt);

  // Determine phase (priority order)
  let phase: DashboardState['phase'] = 'empty';
  if (active.length === 0) phase = 'empty';
  else if (withProposals.length > 0 || unreadProposals.length > 0) phase = 'proposals_arrived';
  else if (comparing.length > 0) phase = 'comparing';
  else if (selected.length > 0) phase = 'selected';
  else if (completed.length > 0 && waiting.length === 0) phase = 'completed';
  else if (waiting.length > 0) phase = 'waiting';

  // Primary concern = most actionable
  const primaryConcern =
    withProposals[0] || comparing[0] || waiting[0] || selected[0] || active[0] || null;

  return {
    hasConcern: active.length > 0,
    activeConcernCount: active.length,
    waitingProposalCount: waiting.length,
    unreadProposalCount: unreadProposals.length,
    comparingConcernCount: comparing.length,
    completedConcernCount: completed.length,
    primaryConcern,
    phase,
  };
}

/* ── Concern Helper State ── */

export interface ConcernActions {
  editable: boolean;
  canAddPhotos: boolean;
  hasNewProposal: boolean;
  canCompare: boolean;
  canBuyReport: boolean;
  canBuyService: boolean;
  canAddConcern: boolean;
  nextAction: string;
  nextActionHref: string;
}

export function computeConcernActions(concern: Concern, proposals: Proposal[]): ConcernActions {
  const concernProposals = proposals.filter(p => p.concernId === concern.id && p.isActive);
  const unread = concernProposals.filter(p => p.status === 'sent' && !p.viewedAt);
  const shortlisted = concernProposals.filter(p => p.status === 'shortlisted');

  const s = concern.status;

  return {
    editable: s === 'draft' || s === 'submitted',
    canAddPhotos: s === 'draft' || s === 'submitted',
    hasNewProposal: unread.length > 0,
    canCompare: shortlisted.length >= 2 || (s === 'comparing'),
    canBuyReport: s === 'comparing' || s === 'proposal_received',
    canBuyService: s === 'hospital_selected',
    canAddConcern: true, // always
    nextAction: getNextAction(s, concernProposals.length, unread.length),
    nextActionHref: getNextActionHref(concern, s, concernProposals.length),
  };
}

function getNextAction(status: string, proposalCount: number, unreadCount: number): string {
  switch (status) {
    case 'draft': return '이어서 작성하기';
    case 'submitted': return proposalCount > 0 ? '제안서 확인하기' : '제안 대기 중';
    case 'proposal_received': return unreadCount > 0 ? `새 제안서 ${unreadCount}개` : '제안서 확인하기';
    case 'comparing': return '비교 계속하기';
    case 'report_purchased': return '리포트 확인하기';
    case 'hospital_selected': return '서비스 준비하기';
    case 'service_purchased': return '진행 상황 확인';
    case 'completed': return '다른 고민 등록하기';
    default: return '상세 보기';
  }
}

function getNextActionHref(concern: Concern, status: string, proposalCount: number): string {
  switch (status) {
    case 'draft': return '/consult';
    case 'submitted': return proposalCount > 0 ? `/concerns/${concern.id}/proposals` : `/concerns/${concern.id}`;
    case 'proposal_received': return `/concerns/${concern.id}/proposals`;
    case 'comparing': return `/concerns/${concern.id}/compare`;
    case 'report_purchased': return `/concerns/${concern.id}/proposals`;
    case 'hospital_selected': return `/concerns/${concern.id}`;
    case 'service_purchased': return `/concerns/${concern.id}`;
    case 'completed': return '/consult';
    default: return `/concerns/${concern.id}`;
  }
}

/* ── Article Recommendation ── */

interface ArticleRecommendation {
  title: string;
  tag: string;
  tagColor: 'info' | 'default' | 'danger' | 'warning';
  gradient: string;
}

export function getRecommendedArticles(bodyArea: string, status: string): ArticleRecommendation[] {
  const articles: Record<string, ArticleRecommendation[]> = {
    '눈': [
      { title: '매몰 vs 절개 쌍꺼풀, 어떤 차이가 있을까?', tag: '시술 비교', tagColor: 'info', gradient: 'from-[#e3f2fd] to-[#bbdefb]' },
      { title: '한국 쌍꺼풀 수술 평균 회복기간', tag: '회복 정보', tagColor: 'default', gradient: 'from-[#e8f5e9] to-[#c8e6c9]' },
      { title: '눈 성형 과잉진료 주의 포인트', tag: '안전 정보', tagColor: 'danger', gradient: 'from-[#fce4ec] to-[#f8bbd0]' },
    ],
    '코': [
      { title: '코끝 성형, 자연스러움의 기준은?', tag: '시술 가이드', tagColor: 'info', gradient: 'from-[#fff3e0] to-[#ffe0b2]' },
      { title: '코성형 평균 가격과 적정 범위', tag: '비용 가이드', tagColor: 'default', gradient: 'from-[#e3f2fd] to-[#bbdefb]' },
      { title: '코성형 부작용, 사전에 확인하세요', tag: '안전 정보', tagColor: 'danger', gradient: 'from-[#fce4ec] to-[#f8bbd0]' },
    ],
    '리프팅': [
      { title: '실리프팅 vs 울쎄라, 나에게 맞는 선택', tag: '시술 비교', tagColor: 'info', gradient: 'from-[#f3e5f5] to-[#e1bee7]' },
      { title: '리프팅 효과 유지 기간과 관리법', tag: '관리 가이드', tagColor: 'default', gradient: 'from-[#e8f5e9] to-[#c8e6c9]' },
      { title: '리프팅 부작용, 이것만은 꼭 확인하세요', tag: '안전 정보', tagColor: 'danger', gradient: 'from-[#fce4ec] to-[#f8bbd0]' },
    ],
  };

  const defaults: ArticleRecommendation[] = [
    { title: '한국 성형 트렌드 2026', tag: '트렌드', tagColor: 'info', gradient: 'from-[#e3f2fd] to-[#bbdefb]' },
    { title: '성형 전 꼭 확인해야 할 5가지', tag: '필수 체크', tagColor: 'warning', gradient: 'from-[#fff3e0] to-[#ffe0b2]' },
    { title: '안전한 성형을 위한 병원 선택 기준', tag: '안전 정보', tagColor: 'danger', gradient: 'from-[#fce4ec] to-[#f8bbd0]' },
  ];

  // Status-specific additions
  if (status === 'comparing' || status === 'proposal_received') {
    const base = articles[bodyArea] || defaults;
    return [
      { title: '제안서 비교할 때 꼭 확인해야 할 항목', tag: '판단 가이드', tagColor: 'warning', gradient: 'from-[#fff8e1] to-[#ffecb3]' },
      ...base.slice(0, 2),
    ];
  }

  return articles[bodyArea] || defaults;
}

/* ── Status Labels (Korean) ── */

export const STATUS_LABELS: Record<string, string> = {
  draft: '작성 중',
  submitted: '제안 대기 중',
  proposal_received: '제안 도착',
  comparing: '비교 중',
  report_purchased: '리포트 확인 중',
  hospital_selected: '병원 선택 완료',
  service_purchased: '서비스 진행 중',
  completed: '완료',
  cancelled: '취소됨',
};

export const STATUS_COLORS: Record<string, 'info' | 'warning' | 'success' | 'danger' | 'default'> = {
  draft: 'default',
  submitted: 'warning',
  proposal_received: 'info',
  comparing: 'info',
  report_purchased: 'info',
  hospital_selected: 'success',
  service_purchased: 'success',
  completed: 'success',
  cancelled: 'danger',
};

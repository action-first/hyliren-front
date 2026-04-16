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

  let phase: DashboardState['phase'] = 'empty';
  if (active.length === 0) phase = 'empty';
  else if (withProposals.length > 0 || unreadProposals.length > 0) phase = 'proposals_arrived';
  else if (comparing.length > 0) phase = 'comparing';
  else if (selected.length > 0) phase = 'selected';
  else if (completed.length > 0 && waiting.length === 0) phase = 'completed';
  else if (waiting.length > 0) phase = 'waiting';

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

/* ══════════════════════════════════════
   Concern Actions — 상태 기반 행동 설계
   ══════════════════════════════════════ */

export type ConcernActionItem = {
  label: string;
  href: string;
  variant: 'primary' | 'secondary' | 'ghost';
};

export interface ConcernActions {
  statusLabel: string;
  statusColor: 'info' | 'warning' | 'success' | 'danger' | 'default';
  helperMessage: string;
  editable: boolean;
  canAddPhotos: boolean;
  hasNewProposal: boolean;
  canCompare: boolean;
  canBuyReport: boolean;
  canBuyService: boolean;
  canAddConcern: boolean;
  primaryAction: ConcernActionItem | null;
  secondaryAction: ConcernActionItem | null;
  extraActions: ConcernActionItem[];
}

export function computeConcernActions(concern: Concern, proposals: Proposal[]): ConcernActions {
  const concernProposals = proposals.filter(p => p.concernId === concern.id && p.isActive);
  const unread = concernProposals.filter(p => p.status === 'sent' && !p.viewedAt);
  const shortlisted = concernProposals.filter(p => p.status === 'shortlisted');

  const s = concern.status;
  const cid = concern.id;

  // Booleans
  const editable = s === 'draft' || s === 'submitted';
  const canAddPhotos = s === 'draft' || s === 'submitted';
  const hasNewProposal = unread.length > 0;
  const canCompare = shortlisted.length >= 2 || s === 'comparing';
  const canBuyReport = s === 'comparing' || s === 'proposal_received';
  const canBuyService = s === 'hospital_selected';

  // Status display
  const statusLabel = STATUS_LABELS[s] || s;
  const statusColor = STATUS_COLORS[s] || 'default';

  // State-based action design
  let primaryAction: ConcernActionItem | null = null;
  let secondaryAction: ConcernActionItem | null = null;
  const extraActions: ConcernActionItem[] = [];
  let helperMessage = '';

  switch (s) {
    case 'draft':
      primaryAction = { label: '이어서 상담 작성하기', href: '/consult', variant: 'primary' };
      helperMessage = '사진과 고민을 정리해 상담을 완료하세요';
      break;

    case 'submitted':
      if (concernProposals.length > 0) {
        primaryAction = { label: '도착한 제안 확인하기', href: `/concerns/${cid}/proposals`, variant: 'primary' };
      } else {
        primaryAction = { label: '고민 내용 수정하기', href: '/consult', variant: 'primary' };
      }
      secondaryAction = { label: '관련 정보 읽기', href: '/articles', variant: 'secondary' };
      helperMessage = '보통 24~48시간 내 제안이 도착합니다';
      break;

    case 'proposal_received':
      primaryAction = { label: '받은 제안 확인하기', href: `/concerns/${cid}/proposals`, variant: 'primary' };
      helperMessage = '바로 선택하지 말고 먼저 분석해보세요';
      if (unread.length > 0) {
        extraActions.push({ label: `새 제안 ${unread.length}건 도착`, href: `/concerns/${cid}/proposals`, variant: 'ghost' });
      }
      break;

    case 'comparing':
      primaryAction = { label: '비교 분석 계속하기', href: '/decision', variant: 'primary' };
      helperMessage = '가격·리스크·과잉진료 여부를 함께 확인하세요';
      break;

    case 'report_purchased':
      primaryAction = { label: '분석 결과 확인하기', href: '/decision', variant: 'primary' };
      secondaryAction = { label: '받은 제안 다시 보기', href: `/concerns/${cid}/proposals`, variant: 'secondary' };
      helperMessage = '분석 결과를 바탕으로 선택을 정리해보세요';
      break;

    case 'hospital_selected':
      // 서비스 섹션은 페이지 하단에 인라인으로 표시됨 — CTA는 서비스 연결
      primaryAction = { label: '일정·통역·픽업 준비하기', href: `/concerns/${cid}/services`, variant: 'primary' };
      secondaryAction = { label: '선택한 제안 다시 보기', href: `/concerns/${cid}/proposals`, variant: 'secondary' };
      helperMessage = '통역, 일정, 픽업 등 다음 준비를 진행하세요';
      break;

    case 'service_purchased':
      primaryAction = { label: '서비스 진행 상황 보기', href: `/concerns/${cid}/services`, variant: 'primary' };
      secondaryAction = { label: '추가 고민 등록하기', href: '/consult', variant: 'secondary' };
      helperMessage = '서비스 준비 상태를 확인하고 필요한 내용을 보완하세요';
      break;

    case 'completed':
      primaryAction = { label: '다른 고민 등록하기', href: '/consult', variant: 'primary' };
      secondaryAction = { label: '관련 아티클 보기', href: '/articles', variant: 'secondary' };
      helperMessage = '다른 부위나 추가 고민도 상담할 수 있습니다';
      break;

    case 'cancelled':
      primaryAction = { label: '다시 상담 시작하기', href: '/consult', variant: 'primary' };
      helperMessage = '고민을 다시 정리해 새로 시작할 수 있습니다';
      break;

    default:
      primaryAction = { label: '상세 보기', href: `/concerns/${cid}/proposals`, variant: 'primary' };
      helperMessage = '';
  }

  return {
    statusLabel,
    statusColor,
    helperMessage,
    editable,
    canAddPhotos,
    hasNewProposal,
    canCompare,
    canBuyReport,
    canBuyService,
    canAddConcern: true,
    primaryAction,
    secondaryAction,
    extraActions,
  };
}

/* ── Article Recommendation (상태 중심) ── */

interface ArticleRecommendation {
  title: string;
  tag: string;
  tagColor: 'info' | 'default' | 'danger' | 'warning';
  gradient: string;
}

/** 부위별 기본 아티클 */
const AREA_ARTICLES: Record<string, ArticleRecommendation[]> = {
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

const DEFAULT_ARTICLES: ArticleRecommendation[] = [
  { title: '한국 성형 트렌드 2026', tag: '트렌드', tagColor: 'info', gradient: 'from-[#e3f2fd] to-[#bbdefb]' },
  { title: '성형 전 꼭 확인해야 할 5가지', tag: '필수 체크', tagColor: 'warning', gradient: 'from-[#fff3e0] to-[#ffe0b2]' },
  { title: '안전한 성형을 위한 병원 선택 기준', tag: '안전 정보', tagColor: 'danger', gradient: 'from-[#fce4ec] to-[#f8bbd0]' },
];

/** 상태별 의도에 맞는 아티클 우선 노출 */
const STATUS_ARTICLES: Record<string, ArticleRecommendation[]> = {
  // 대기 — 준비/이해 콘텐츠
  submitted: [
    { title: '상담 등록 후, 제안을 기다리며 할 일', tag: '준비 가이드', tagColor: 'default', gradient: 'from-[#e8f5e9] to-[#c8e6c9]' },
    { title: '좋은 제안서를 받기 위한 사진 팁', tag: '사진 가이드', tagColor: 'info', gradient: 'from-[#e3f2fd] to-[#bbdefb]' },
  ],
  // 제안 도착 — 판단/이해 콘텐츠
  proposal_received: [
    { title: '제안서에서 꼭 확인해야 할 5가지 항목', tag: '판단 가이드', tagColor: 'warning', gradient: 'from-[#fff8e1] to-[#ffecb3]' },
    { title: '가격이 다른 이유, 무엇을 비교해야 할까?', tag: '비교 기준', tagColor: 'info', gradient: 'from-[#e3f2fd] to-[#bbdefb]' },
  ],
  // 비교 중 — 검증/판단 콘텐츠
  comparing: [
    { title: '제안서 비교할 때 꼭 확인해야 할 항목', tag: '판단 가이드', tagColor: 'warning', gradient: 'from-[#fff8e1] to-[#ffecb3]' },
    { title: '과잉진료 체크리스트: 이건 꼭 필요한 시술인가?', tag: '검증 체크', tagColor: 'danger', gradient: 'from-[#fce4ec] to-[#f8bbd0]' },
  ],
  // 리포트 확인 — 결정 지원 콘텐츠
  report_purchased: [
    { title: '리포트 결과 해석하기: 점수의 의미', tag: '해석 가이드', tagColor: 'info', gradient: 'from-[#e3f2fd] to-[#bbdefb]' },
    { title: '최종 병원 선택 전, 마지막 체크 항목', tag: '결정 가이드', tagColor: 'warning', gradient: 'from-[#fff8e1] to-[#ffecb3]' },
  ],
  // 병원 선택 완료 — 실행 준비 콘텐츠
  hospital_selected: [
    { title: '한국 방문 전 준비 체크리스트', tag: '준비 가이드', tagColor: 'default', gradient: 'from-[#e8f5e9] to-[#c8e6c9]' },
    { title: '시술 전후 주의사항 총정리', tag: '케어 가이드', tagColor: 'warning', gradient: 'from-[#fff8e1] to-[#ffecb3]' },
  ],
  // 서비스 진행 — 케어 콘텐츠
  service_purchased: [
    { title: '시술 당일, 이것만 기억하세요', tag: '당일 가이드', tagColor: 'warning', gradient: 'from-[#fff8e1] to-[#ffecb3]' },
    { title: '회복 기간 관리법과 주의사항', tag: '회복 가이드', tagColor: 'default', gradient: 'from-[#e8f5e9] to-[#c8e6c9]' },
  ],
  // 완료 — 추가 고민/트렌드 콘텐츠
  completed: [
    { title: '시술 후 만족도를 높이는 사후관리 팁', tag: '사후관리', tagColor: 'default', gradient: 'from-[#e8f5e9] to-[#c8e6c9]' },
    { title: '다른 부위도 고민 중이라면: 복합 시술 가이드', tag: '트렌드', tagColor: 'info', gradient: 'from-[#e3f2fd] to-[#bbdefb]' },
  ],
};

export function getRecommendedArticles(bodyArea: string, status: string): ArticleRecommendation[] {
  const statusSpecific = STATUS_ARTICLES[status];
  const areaSpecific = AREA_ARTICLES[bodyArea] || DEFAULT_ARTICLES;

  if (statusSpecific) {
    // 상태별 1~2개 + 부위별 1개
    return [...statusSpecific.slice(0, 2), areaSpecific[0]].filter(Boolean);
  }

  return areaSpecific;
}

/* ── Status Labels (상태 표시 전용 — CTA와 혼용 금지) ── */

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

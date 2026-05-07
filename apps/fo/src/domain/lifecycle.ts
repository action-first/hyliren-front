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
  /** i18n key — 컴포넌트가 t(label, i18nParams) 로 매핑. */
  label: string;
  /** dynamic interpolation params (예: 새 제안 N건). */
  i18nParams?: Record<string, string | number>;
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

  // i18n key 패턴 — label/helperMessage 는 컴포넌트가 t() 로 매핑.
  // dynamic params (예: 새 제안 N건) 은 별도 i18nParams 필드로 전달.
  switch (s) {
    case 'draft':
      primaryAction = { label: 'lifecycle.draft.primary', href: '/consult', variant: 'primary' };
      helperMessage = 'lifecycle.draft.helper';
      break;

    case 'submitted':
      if (concernProposals.length > 0) {
        primaryAction = { label: 'lifecycle.submitted.primaryWithProposal', href: `/concerns/${cid}/proposals`, variant: 'primary' };
      } else {
        primaryAction = { label: 'lifecycle.submitted.primaryEditConcern', href: '/consult', variant: 'primary' };
      }
      secondaryAction = { label: 'lifecycle.submitted.secondary', href: '/articles', variant: 'secondary' };
      helperMessage = 'lifecycle.submitted.helper';
      break;

    case 'proposal_received':
      primaryAction = { label: 'lifecycle.proposalReceived.primary', href: `/concerns/${cid}/proposals`, variant: 'primary' };
      helperMessage = 'lifecycle.proposalReceived.helper';
      if (unread.length > 0) {
        extraActions.push({
          label: 'lifecycle.proposalReceived.extraNewArrived',
          i18nParams: { count: unread.length },
          href: `/concerns/${cid}/proposals`,
          variant: 'ghost',
        });
      }
      break;

    case 'comparing':
      primaryAction = { label: 'lifecycle.comparing.primary', href: '/decision', variant: 'primary' };
      helperMessage = 'lifecycle.comparing.helper';
      break;

    case 'report_purchased':
      primaryAction = { label: 'lifecycle.reportPurchased.primary', href: '/decision', variant: 'primary' };
      secondaryAction = { label: 'lifecycle.reportPurchased.secondary', href: `/concerns/${cid}/proposals`, variant: 'secondary' };
      helperMessage = 'lifecycle.reportPurchased.helper';
      break;

    case 'hospital_selected':
      primaryAction = { label: 'lifecycle.hospitalSelected.primary', href: `/concerns/${cid}/services`, variant: 'primary' };
      secondaryAction = { label: 'lifecycle.hospitalSelected.secondary', href: `/concerns/${cid}/proposals`, variant: 'secondary' };
      helperMessage = 'lifecycle.hospitalSelected.helper';
      break;

    case 'service_purchased':
      primaryAction = { label: 'lifecycle.servicePurchased.primary', href: `/concerns/${cid}/services`, variant: 'primary' };
      secondaryAction = { label: 'lifecycle.servicePurchased.secondary', href: '/consult', variant: 'secondary' };
      helperMessage = 'lifecycle.servicePurchased.helper';
      break;

    case 'completed':
      primaryAction = { label: 'lifecycle.completed.primary', href: '/consult', variant: 'primary' };
      secondaryAction = { label: 'lifecycle.completed.secondary', href: '/articles', variant: 'secondary' };
      helperMessage = 'lifecycle.completed.helper';
      break;

    case 'cancelled':
      primaryAction = { label: 'lifecycle.cancelled.primary', href: '/consult', variant: 'primary' };
      helperMessage = 'lifecycle.cancelled.helper';
      break;

    default:
      primaryAction = { label: 'lifecycle.fallback.primary', href: `/concerns/${cid}/proposals`, variant: 'primary' };
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

/**
 * 정적 한국어 article 추천 dict 는 i18n 정책 위반 (모든 로케일에 한국어 노출) 으로 폐기.
 * 추천 카드는 BE listRelatedArticles({ area }) 로 일원화 — Accept-Language 따라 다국어 자동.
 * 사용처는 dashboard/page.tsx RecommendedArticlesSection 와 concerns/[id] RelatedArticlesSection.
 */

/* ── Status Labels (상태 표시 전용 — CTA와 혼용 금지) ──
   i18n key 매핑 — 컴포넌트가 t(STATUS_LABELS[status]) 로 렌더링. */

export const STATUS_LABELS: Record<string, string> = {
  draft: 'lifecycle.status.draft',
  submitted: 'lifecycle.status.submitted',
  proposal_received: 'lifecycle.status.proposalReceived',
  comparing: 'lifecycle.status.comparing',
  report_purchased: 'lifecycle.status.reportPurchased',
  hospital_selected: 'lifecycle.status.hospitalSelected',
  service_purchased: 'lifecycle.status.servicePurchased',
  completed: 'lifecycle.status.completed',
  cancelled: 'lifecycle.status.cancelled',
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

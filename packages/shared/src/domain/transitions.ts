/**
 * 상태 전이 — 순수 함수만 허용
 *
 * 규칙:
 *   - 입력: 현재 상태 + 액션
 *   - 출력: 가능 여부 / 다음 상태
 *   - DB 호출, API 호출, UI 로직 절대 금지
 *   - 이 파일 밖에서 상태 전이 로직 작성 금지
 */

import type { ConcernStatus, ProposalStatus } from '../constants';

// ============================================================
// Concern 상태 전이
// ============================================================

type ConcernAction =
  | 'submit'
  | 'receive_proposal'
  | 'start_comparing'
  | 'purchase_report'
  | 'select_hospital'
  | 'purchase_service'
  | 'complete'
  | 'cancel';

const CONCERN_TRANSITIONS: Record<ConcernStatus, Partial<Record<ConcernAction, ConcernStatus>>> = {
  draft:              { submit: 'submitted', cancel: 'cancelled' },
  submitted:          { receive_proposal: 'proposal_received', cancel: 'cancelled' },
  proposal_received:  { start_comparing: 'comparing', cancel: 'cancelled' },
  comparing:          { purchase_report: 'report_purchased', select_hospital: 'hospital_selected', cancel: 'cancelled' },
  report_purchased:   { select_hospital: 'hospital_selected', cancel: 'cancelled' },
  hospital_selected:  { purchase_service: 'service_purchased', complete: 'completed' },
  service_purchased:  { complete: 'completed' },
  completed:          {},
  cancelled:          {},
};

export function canTransitionConcern(current: ConcernStatus, action: ConcernAction): boolean {
  return CONCERN_TRANSITIONS[current]?.[action] !== undefined;
}

export function transitionConcern(current: ConcernStatus, action: ConcernAction): ConcernStatus {
  const next = CONCERN_TRANSITIONS[current]?.[action];
  if (!next) {
    throw new Error(`Invalid concern transition: ${current} + ${action}`);
  }
  return next;
}

export function getAvailableConcernActions(current: ConcernStatus): ConcernAction[] {
  return Object.keys(CONCERN_TRANSITIONS[current] || {}) as ConcernAction[];
}

// ============================================================
// Proposal 상태 전이
// ============================================================

type ProposalAction =
  | 'send'
  | 'view'
  | 'shortlist'
  | 'select'
  | 'reject';

const PROPOSAL_TRANSITIONS: Record<ProposalStatus, Partial<Record<ProposalAction, ProposalStatus>>> = {
  draft:       { send: 'sent' },
  sent:        { view: 'viewed' },
  viewed:      { shortlist: 'shortlisted', reject: 'rejected' },
  shortlisted: { select: 'selected', reject: 'rejected' },
  selected:    {},
  rejected:    {},
  // DB 값 (PR-A1 에서 추가). UI 레이어에서는 selected 와 등가로 취급.
  accepted:    {},
  expired:     {},
};

export function canTransitionProposal(current: ProposalStatus, action: ProposalAction): boolean {
  return PROPOSAL_TRANSITIONS[current]?.[action] !== undefined;
}

export function transitionProposal(current: ProposalStatus, action: ProposalAction): ProposalStatus {
  const next = PROPOSAL_TRANSITIONS[current]?.[action];
  if (!next) {
    throw new Error(`Invalid proposal transition: ${current} + ${action}`);
  }
  return next;
}

export function getAvailableProposalActions(current: ProposalStatus): ProposalAction[] {
  return Object.keys(PROPOSAL_TRANSITIONS[current] || {}) as ProposalAction[];
}

// ============================================================
// Type exports
// ============================================================

export type { ConcernAction, ProposalAction };

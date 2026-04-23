import type { Proposal } from '../types';
import type { ProposalStatus } from '../constants';

/**
 * Proposal status 해석 헬퍼.
 *
 * DB (proposals.status) 는 draft/sent/accepted/rejected/expired 를 사용하고
 * FO UI 에서는 viewed/shortlisted/selected 같은 파생 상태도 공존한다.
 * 컴포넌트에서 `p.status === 'selected'` 하드코딩 대신 이 헬퍼를 쓰면
 * real backend 전환 (mock 의 'selected' → DB 의 'accepted') 시 무영향.
 */

/** "병원이 이 제안을 수락·선택받았다" — DB 'accepted' + UI 'selected' 둘 다 true */
export function isProposalAccepted(proposal: Pick<Proposal, 'status'>): boolean {
  return proposal.status === 'accepted' || proposal.status === 'selected';
}

/** "병원이 이 제안을 거절/만료받았다" — DB 'rejected' 또는 'expired' 모두 */
export function isProposalDeclined(proposal: Pick<Proposal, 'status'>): boolean {
  return proposal.status === 'rejected' || proposal.status === 'expired';
}

/** "고객에게 발송되었고 아직 결정되지 않음" */
export function isProposalPending(proposal: Pick<Proposal, 'status'>): boolean {
  return proposal.status === 'sent' || proposal.status === 'viewed' || proposal.status === 'shortlisted';
}

/**
 * 주어진 ProposalStatus 가 DB 에 실제 저장될 수 있는 값인지 (vs UI 전용 파생값인지).
 * 본개발 시 FO → backend 방향 쓰기 작업에서 사용.
 */
const DB_STATUSES: ProposalStatus[] = ['draft', 'sent', 'accepted', 'rejected', 'expired'];
export function isDbProposalStatus(status: ProposalStatus): boolean {
  return DB_STATUSES.includes(status);
}

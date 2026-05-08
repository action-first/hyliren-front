import { request } from '@/lib/api/client';

import type {
  CreateProposalBody,
  ProposalDetailWire,
  ProposalListWire,
  UpdateProposalBody,
} from './types';

// 가격 단위 SSOT (CLAUDE.md): FE 입력 / BE 저장 / 표시 모두 원 단위로 통일.
// 만원→원 변환 (manToKrw) 폐기 — 사용자 입력값을 그대로 BE 전송.

export function createProposal(concernId: string, body: CreateProposalBody): Promise<ProposalDetailWire> {
  return request<ProposalDetailWire>(`/api/v1/concerns/${encodeURIComponent(concernId)}/proposals`, {
    method: 'POST',
    body,
  });
}

export interface MyProposalsQuery {
  /** YYYY-MM-DD */
  sentAtFrom?: string;
  /** YYYY-MM-DD (해당일 끝까지 포함) */
  sentAtTo?: string;
  /** raw status 값 (sent / accepted / rejected / expired) */
  status?: string;
  /** proposal_items.treatment_name ILIKE 통합 검색 */
  keyword?: string;
}

export function listMyProposals(query?: MyProposalsQuery): Promise<ProposalListWire> {
  const params = new URLSearchParams();
  if (query?.sentAtFrom) params.set('sentAtFrom', query.sentAtFrom);
  if (query?.sentAtTo) params.set('sentAtTo', query.sentAtTo);
  if (query?.status) params.set('status', query.status);
  if (query?.keyword) params.set('keyword', query.keyword);
  const qs = params.toString();
  return request<ProposalListWire>(qs ? `/api/v1/proposals/me?${qs}` : '/api/v1/proposals/me');
}

export function findMyProposalByConcern(concernId: string): Promise<ProposalDetailWire | null> {
  return request<ProposalDetailWire | null>(
    `/api/v1/concerns/${encodeURIComponent(concernId)}/proposals/me`,
  );
}

export function updateProposal(proposalId: string, body: UpdateProposalBody): Promise<ProposalDetailWire> {
  return request<ProposalDetailWire>(`/api/v1/proposals/${encodeURIComponent(proposalId)}`, {
    method: 'PATCH',
    body,
  });
}

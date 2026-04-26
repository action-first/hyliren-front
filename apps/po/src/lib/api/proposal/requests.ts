import { request } from '@/lib/api/client';

import type {
  CreateProposalBody,
  ProposalDetailWire,
  ProposalListWire,
  UpdateProposalBody,
} from './types';
import { manToKrw } from './price';

function toBackendCreateBody(body: CreateProposalBody): CreateProposalBody {
  return {
    ...body,
    totalPrice: manToKrw(body.totalPrice),
    items: body.items.map(item => ({
      ...item,
      price: manToKrw(item.price),
    })),
  };
}

function toBackendUpdateBody(body: UpdateProposalBody): UpdateProposalBody {
  return {
    ...body,
    totalPrice: body.totalPrice === undefined ? undefined : manToKrw(body.totalPrice),
    items: body.items?.map(item => ({
      ...item,
      price: manToKrw(item.price),
    })),
  };
}

export function createProposal(concernId: string, body: CreateProposalBody): Promise<ProposalDetailWire> {
  return request<ProposalDetailWire>(`/api/v1/concerns/${encodeURIComponent(concernId)}/proposals`, {
    method: 'POST',
    body: toBackendCreateBody(body),
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
    body: toBackendUpdateBody(body),
  });
}

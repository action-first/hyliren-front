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

export function listMyProposals(): Promise<ProposalListWire> {
  return request<ProposalListWire>('/api/v1/proposals/me');
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

import { request } from '../client';
import { krwToMan } from '@hyliren/shared';
import type { ProposalDetailWire, ProposalListWire } from './types';

function normalizeProposalDetail(wire: ProposalDetailWire): ProposalDetailWire {
  return {
    ...wire,
    totalPrice: krwToMan(wire.totalPrice),
    items: wire.items.map(item => ({
      ...item,
      price: krwToMan(item.price),
    })),
  };
}

export function listProposals(concernId: string): Promise<ProposalListWire> {
  return request<ProposalListWire>(`/api/v1/concerns/${concernId}/proposals`, { method: 'GET' });
}

export function getProposal(proposalId: string): Promise<ProposalDetailWire> {
  return request<ProposalDetailWire>(`/api/v1/proposals/${proposalId}`, { method: 'GET' })
    .then(normalizeProposalDetail);
}

export function selectHospital(concernId: string, proposalId: string): Promise<{ id: string }> {
  return request<{ id: string }>(`/api/v1/concerns/${concernId}/select-hospital`, {
    method: 'POST',
    body: JSON.stringify({ proposalId }),
  });
}

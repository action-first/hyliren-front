import { request } from '../client';
import type { ProposalListWire } from './types';

export function listProposals(concernId: string): Promise<ProposalListWire> {
  return request<ProposalListWire>(`/api/v1/concerns/${concernId}/proposals`, { method: 'GET' });
}

export function selectHospital(concernId: string, proposalId: string): Promise<{ id: string }> {
  return request<{ id: string }>(`/api/v1/concerns/${concernId}/select-hospital`, {
    method: 'POST',
    body: JSON.stringify({ proposalId }),
  });
}

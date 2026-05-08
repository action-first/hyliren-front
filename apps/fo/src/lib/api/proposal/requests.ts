import { request } from '../client';
import type { ProposalDetailWire, ProposalListWire } from './types';

// 가격 단위 SSOT (CLAUDE.md): BE / FE / 표시 모두 원 단위. 만원 변환 (krwToMan) 폐기.

export function listProposals(concernId: string): Promise<ProposalListWire> {
  return request<ProposalListWire>(`/api/v1/concerns/${concernId}/proposals`, { method: 'GET' });
}

export function getProposal(proposalId: string): Promise<ProposalDetailWire> {
  return request<ProposalDetailWire>(`/api/v1/proposals/${proposalId}`, { method: 'GET' });
}

export function selectHospital(concernId: string, proposalId: string): Promise<{ id: string }> {
  return request<{ id: string }>(`/api/v1/concerns/${concernId}/select-hospital`, {
    method: 'POST',
    body: JSON.stringify({ proposalId }),
  });
}

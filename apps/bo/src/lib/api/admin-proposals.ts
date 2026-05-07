/**
 * Admin Proposals API client — direct backend 호출 (BFF 미경유).
 * admin-partners.ts / admin-buyers.ts 와 동일 컨벤션.
 *
 * BE: hyliren-api/apps/admin
 *   - GET /admin/proposals
 *   - GET /admin/proposals/:id
 */
import type { ConcernStatus, ProposalStatus } from '@hyliren/shared';
import { request } from './client';

export interface AdminProposalListItem {
  id: string;
  concernId: string;
  memberId: string;
  primaryArea: string;
  hospitalName: string | null;
  totalPrice: number;
  status: ProposalStatus;
  sentAt: string | null;
}

export interface AdminProposalSelf {
  id: string;
  status: ProposalStatus;
  totalPrice: number;
  recoveryDays: number;
  anesthesiaType: string;
  hospitalStayDays: number;
  availableDateFrom: string | null;
  availableDateTo: string | null;
  consultationNote: string | null;
  sentAt: string | null;
  viewedAt: string | null;
  creditsCharged: number;
}

export interface AdminProposalItem {
  id: string;
  treatmentName: string;
  treatmentNameZh: string | null;
  price: number;
}

export interface AdminProposalConcern {
  id: string;
  primaryArea: string;
  bodyAreaDetail: string | null;
  budgetMin: number | null;
  budgetMax: number | null;
  status: ConcernStatus;
}

export interface AdminProposalUser {
  id: string;
  name: string;
}

export interface AdminProposalHospital {
  hospitalName: string | null;
  verified: boolean;
}

export interface AdminProposalDetail {
  proposal: AdminProposalSelf;
  items: AdminProposalItem[];
  concern: AdminProposalConcern | null;
  user: AdminProposalUser | null;
  hospital: AdminProposalHospital | null;
}

export async function listProposals(): Promise<AdminProposalListItem[]> {
  return request<AdminProposalListItem[]>('/proposals', { method: 'GET' });
}

export async function getProposalDetail(id: string): Promise<AdminProposalDetail> {
  return request<AdminProposalDetail>(`/proposals/${encodeURIComponent(id)}`, { method: 'GET' });
}

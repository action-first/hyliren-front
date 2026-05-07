/**
 * Admin Buyers API client — direct backend 호출 (BFF 미경유).
 * admin-partners.ts 와 동일 컨벤션. 토큰은 client.ts 의 adminTokenStore 가 자동 첨부.
 *
 * BE: hyliren-api/apps/admin
 *   - GET /admin/buyers
 *   - GET /admin/buyers/:id
 */
import type { ConcernStatus, ProposalStatus } from '@hyliren/shared';
import { request } from './client';

export interface AdminBuyerListItem {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  locale: string;
  concernCount: number;
  latestConcernStatus: ConcernStatus | null;
  createdAt: string;
}

export interface AdminBuyerUser {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  locale: string;
  createdAt: string;
  referredByName: string | null;
  referralCode: string | null;
}

export interface AdminBuyerProfile {
  birthYear: number | null;
  gender: string | null;
  country: string;
  city: string | null;
}

export interface AdminBuyerConcern {
  id: string;
  status: ConcernStatus;
  primaryArea: string;
  bodyAreas: string[];
  description: string | null;
  bodyAreaDetail: string | null;
  budgetMin: number | null;
  budgetMax: number | null;
  visitDateFrom: string | null;
  visitDateTo: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AdminBuyerProposal {
  id: string;
  concernId: string;
  memberId: string;
  hospitalName: string | null;
  status: ProposalStatus;
  totalPrice: number;
  sentAt: string | null;
  viewedAt: string | null;
  updatedAt: string;
}

export interface AdminBuyerStats {
  concernCount: number;
  proposalCount: number;
  viewedCount: number;
  selectedCount: number;
}

export interface AdminBuyerDetail {
  user: AdminBuyerUser;
  profile: AdminBuyerProfile | null;
  concerns: AdminBuyerConcern[];
  proposals: AdminBuyerProposal[];
  stats: AdminBuyerStats;
}

export async function listBuyers(): Promise<AdminBuyerListItem[]> {
  return request<AdminBuyerListItem[]>('/buyers', { method: 'GET' });
}

export async function getBuyerDetail(id: string): Promise<AdminBuyerDetail> {
  return request<AdminBuyerDetail>(`/buyers/${encodeURIComponent(id)}`, { method: 'GET' });
}

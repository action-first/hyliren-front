/**
 * Admin Partners API client — direct backend 호출 (BFF 미경유).
 * admin-auth.ts 와 동일 컨벤션. 토큰은 client.ts 의 adminTokenStore 가 자동 첨부.
 *
 * BE: hyliren-api/apps/admin (NEXT_PUBLIC_ADMIN_API_BASE_URL)
 *   - GET /admin/partners
 *   - GET /admin/partners/:id
 */
import type { ProposalStatus } from '@hyliren/shared';
import { request } from './client';

export interface AdminPartnerListItem {
  id: string;
  hospitalName: string;
  specialties: string[];
  verified: boolean;
  proposalCount: number;
  selectRate: number;
}

export interface AdminPartnerMember {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

export interface AdminPartnerProfile {
  hospitalName: string | null;
  hospitalNameZh: string | null;
  specialties: string[];
  verified: boolean;
  phone: string | null;
  website: string | null;
  address: string | null;
  logoUrl: string | null;
  coverImageUrl: string | null;
}

export interface AdminPartnerProposalSummary {
  id: string;
  status: ProposalStatus;
  totalPrice: number;
  recoveryDays: number;
  anesthesiaType: string;
  sentAt: string | null;
  viewedAt: string | null;
}

export interface AdminPartnerStats {
  proposalCount: number;
  viewedCount: number;
  selectedCount: number;
  viewRate: number;
  selectRate: number;
}

export interface AdminPartnerDetail {
  member: AdminPartnerMember;
  profile: AdminPartnerProfile | null;
  proposals: AdminPartnerProposalSummary[];
  stats: AdminPartnerStats;
}

export async function listPartners(): Promise<AdminPartnerListItem[]> {
  return request<AdminPartnerListItem[]>('/partners', { method: 'GET' });
}

export async function getPartnerDetail(id: string): Promise<AdminPartnerDetail> {
  return request<AdminPartnerDetail>(`/partners/${encodeURIComponent(id)}`, { method: 'GET' });
}

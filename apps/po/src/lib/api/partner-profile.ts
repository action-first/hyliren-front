/**
 * Partner 프로필 API 클라이언트.
 * BE PR #23 — GET /profile/me + PATCH /profile/me (upsert).
 */
import type { BodyArea } from '@hyliren/shared';
import { request } from './client';

const BASE = '/api/v1/profile';

export interface PartnerProfileWire {
  memberId: string;
  hospitalName: string;
  hospitalNameZh: string | null;
  description: string | null;
  descriptionZh: string | null;
  address: string | null;
  phone: string | null;
  website: string | null;
  logoUrl: string | null;
  coverImageUrl: string | null;
  /** BodyArea[] 형태로 저장 (BE jsonb). FE 에선 BodyArea 로 좁혀 쓴다. */
  specialties: string[];
  verified: boolean;
  /** ISO 문자열. 미존재 회원이면 null. */
  createdAt: string | null;
}

export interface UpdatePartnerProfileBody {
  hospitalName?: string;
  hospitalNameZh?: string;
  description?: string;
  descriptionZh?: string;
  address?: string;
  phone?: string;
  website?: string;
  logoUrl?: string;
  coverImageUrl?: string;
  specialties?: BodyArea[];
}

export const partnerProfileApi = {
  getMy: (): Promise<PartnerProfileWire> => request<PartnerProfileWire>(`${BASE}/me`),
  updateMy: (body: UpdatePartnerProfileBody): Promise<PartnerProfileWire> =>
    request<PartnerProfileWire>(`${BASE}/me`, {
      method: 'PATCH',
      body,
    }),
};

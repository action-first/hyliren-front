/**
 * Partner 프로필 API 클라이언트.
 * GET /profile/me + PATCH /profile/me (upsert).
 *
 * i18n 컨벤션 — partner_profile_translations 테이블 분리 (BE PR #29):
 * - 다국어 컨텐츠 (hospitalName / description) 는 i18n Record 로 전달
 * - 비-i18n 메타 (address, phone, website, logoUrl, coverImageUrl, specialties) 는 그대로 flat
 */
import type { BodyArea } from '@hyliren/shared';
import { request } from './client';

const BASE = '/api/v1/profile';

export type Locale = 'ko' | 'zh-CN' | 'ja' | 'en';

export interface PartnerProfileI18nBlock {
  hospitalName: string;
  description: string | null;
}

export interface PartnerProfileWire {
  memberId: string;
  /** 원본 언어 — i18n fallback 기준 */
  sourceLocale: Locale;
  /** locale 별 다국어 컨텐츠. 미입력 locale 은 키 자체가 없을 수 있음. */
  i18n: Partial<Record<Locale, PartnerProfileI18nBlock>>;
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
  /** locale 별 UPSERT — 전달된 locale 만 처리, 나머지는 유지 */
  i18n?: Partial<Record<Locale, { hospitalName: string; description?: string | null }>>;
  sourceLocale?: Locale;
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

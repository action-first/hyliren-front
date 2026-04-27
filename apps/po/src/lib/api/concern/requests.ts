import { request } from '@/lib/api/client';

import type { ConcernDetailWire, ConcernListWire } from './types';

const BASE = '/api/v1/concerns';

export interface ConcernListQuery {
  /** YYYY-MM-DD */
  createdAtFrom?: string;
  /** YYYY-MM-DD (해당일 23:59:59.999 까지 포함) */
  createdAtTo?: string;
  primaryArea?: string;
  /** BE ConcernStatus enum: 'draft' | 'submitted' | 'closed' (BE @IsEnum 검증). 미지정 시 BE default = submitted */
  status?: 'draft' | 'submitted' | 'closed';
  keyword?: string;
}

export function listConcerns(query?: ConcernListQuery): Promise<ConcernListWire> {
  const params = new URLSearchParams();
  if (query?.createdAtFrom) params.set('createdAtFrom', query.createdAtFrom);
  if (query?.createdAtTo) params.set('createdAtTo', query.createdAtTo);
  if (query?.primaryArea) params.set('primaryArea', query.primaryArea);
  if (query?.status) params.set('status', query.status);
  if (query?.keyword) params.set('keyword', query.keyword);
  const qs = params.toString();
  return request<ConcernListWire>(qs ? `${BASE}?${qs}` : BASE);
}

export function getConcern(id: string): Promise<ConcernDetailWire> {
  return request<ConcernDetailWire>(`${BASE}/${encodeURIComponent(id)}`);
}

import { request } from '@/lib/api/client';

import type {
  ProcedureListWire,
  ProcedureDetailResponseWire,
} from './types';

const BASE = '/api/v1/procedures';

export interface ListProceduresParams {
  sort?: 'popular' | 'recent';
  limit?: number;
  locale?: string;
}

export async function listProcedures(params?: ListProceduresParams): Promise<ProcedureListWire> {
  const qs = new URLSearchParams();
  if (params?.sort) qs.set('sort', params.sort);
  if (params?.limit != null) qs.set('limit', String(params.limit));
  if (params?.locale) qs.set('locale', params.locale);
  const query = qs.toString();
  return request<ProcedureListWire>(`${BASE}${query ? `?${query}` : ''}`, { auth: false });
}

export async function getProcedure(slug: string, locale?: string): Promise<ProcedureDetailResponseWire> {
  const qs = locale ? `?locale=${encodeURIComponent(locale)}` : '';
  return request<ProcedureDetailResponseWire>(`${BASE}/${encodeURIComponent(slug)}${qs}`, { auth: false });
}

export async function consultClickProcedure(slug: string): Promise<void> {
  await request<void>(`${BASE}/${encodeURIComponent(slug)}/consult-click`, {
    method: 'POST',
    auth: false,
  });
}

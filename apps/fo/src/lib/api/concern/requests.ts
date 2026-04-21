import { request } from '@/lib/api/client';

import type {
  ConcernWire,
  ConcernListWire,
  CreateConcernBody,
  UpdateConcernBody,
} from './types';

const BASE = '/api/v1/concerns';

export async function listConcerns(params?: {
  status?: string;
  page?: number;
  limit?: number;
}): Promise<ConcernListWire> {
  const qs = new URLSearchParams();
  if (params?.status) { qs.set('status', params.status); }
  if (params?.page != null) { qs.set('page', String(params.page)); }
  if (params?.limit != null) { qs.set('limit', String(params.limit)); }
  const query = qs.toString();
  return request<ConcernListWire>(`${BASE}${query ? `?${query}` : ''}`);
}

export async function getConcern(id: string): Promise<ConcernWire> {
  return request<ConcernWire>(`${BASE}/${id}`);
}

export async function createConcern(body: CreateConcernBody): Promise<{ id: string }> {
  return request<{ id: string }>(BASE, { method: 'POST', body });
}

export async function updateConcern(id: string, body: UpdateConcernBody): Promise<void> {
  return request<void>(`${BASE}/${id}`, { method: 'PATCH', body });
}

export async function submitConcern(id: string): Promise<void> {
  return request<void>(`${BASE}/${id}/submit`, { method: 'POST' });
}

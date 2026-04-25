import { request } from '@/lib/api/client';

import type { ConcernDetailWire, ConcernListWire } from './types';

const BASE = '/api/v1/concerns';

export function listConcerns(): Promise<ConcernListWire> {
  return request<ConcernListWire>(BASE);
}

export function getConcern(id: string): Promise<ConcernDetailWire> {
  return request<ConcernDetailWire>(`${BASE}/${encodeURIComponent(id)}`);
}

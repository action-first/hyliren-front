import { request } from '@/lib/api/client';

import type {
  ConcernWire,
  ConcernListWire,
  CreateConcernBody,
  UpdateConcernBody,
  AIAnalysisFeedbackBody,
  AIAnalysisWire,
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

/**
 * Backend AI 분석 트리거. 현재 LLM 미통합 placeholder — 호출은 200 OK 반환하지만
 * entity.aiSummary 에 데이터는 채워지지 않음. FE 자체 mock 분석 결과는 client
 * state 로 유지. (백로그: backend LLM 통합 후 getAIAnalysis 로 결과 수령)
 */
export async function requestAIAnalysis(id: string): Promise<{ id: string }> {
  return request<{ id: string }>(`${BASE}/${id}/ai-analysis`, { method: 'POST' });
}

/** Backend AI 분석 결과 조회. backend LLM 통합 전까지는 404 가능 (aiSummary null). */
export async function getAIAnalysis(id: string): Promise<AIAnalysisWire> {
  return request<AIAnalysisWire>(`${BASE}/${id}/ai-analysis`, { method: 'GET' });
}

/**
 * AI 대화 turn 추가. backend 는 message string 만 받고 role/timestamp 는
 * server-side 생성. user turn 만 보냄 (ai turn 은 backend 가 생성).
 */
export async function submitAIAnalysisFeedback(
  id: string,
  body: AIAnalysisFeedbackBody,
): Promise<{ id: string }> {
  return request<{ id: string }>(`${BASE}/${id}/ai-analysis/feedback`, {
    method: 'POST',
    body,
  });
}

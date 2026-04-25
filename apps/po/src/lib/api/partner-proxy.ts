/**
 * Partner Backend BFF 어댑터.
 *
 * PO 의 `/api/procedures/*` Next.js route handler 가 항상 Partner 백엔드
 * (`/partner/api/v1/procedures`) 로 프록시. mock 분기 제거 후 단일 경로.
 *
 *   1. env URL 정규화 — `/partner`, `/partner/api/v1`, bare host 모두 수용
 *   2. 백엔드 요청 — Authorization 헤더 자동 전달, `?memberId=` 쿼리 제거
 *   3. 응답 언래핑 — envelope `{ success, data, timestamp }` 의 data 반환
 *      · 204 No Content: undefined (void 엔드포인트 — variant PATCH/DELETE)
 *      · success:true + data 없음: undefined (void)
 *      · success:false 또는 success 누락: 502 throw
 */

import { NextRequest, NextResponse } from 'next/server';

/** 백엔드 base URL. 정규화: 반환값은 항상 `.../partner/api/v1` 로 끝남. */
function backendBaseUrl(): string {
  const url = process.env.PARTNER_BACKEND_URL ?? process.env.BACKEND_URL;
  if (!url) {
    throw new Error('PARTNER_BACKEND_URL 또는 BACKEND_URL env 가 필요합니다');
  }
  const trimmed = url.replace(/\/$/, '');
  if (trimmed.endsWith('/partner/api/v1')) return trimmed;
  if (trimmed.endsWith('/partner')) return `${trimmed}/api/v1`;
  return `${trimmed}/partner/api/v1`;
}

export interface ProxyOptions {
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  /** 백엔드 상대 경로 (e.g. '/procedures', '/procedures/PC123') — 쿼리 미포함 */
  path: string;
  /** 추가 쿼리 파라미터. memberId 는 여기서 제거됨. */
  searchParams?: URLSearchParams;
  /** body (POST/PATCH 용). 객체는 자동 JSON 직렬화. */
  body?: unknown;
}

/**
 * 백엔드 호출 + envelope 언래핑.
 *
 * 성공(2xx + `{success:true}`)이면 data 반환 (void 엔드포인트는 undefined).
 * 실패(non-2xx 또는 `{success:false}` 또는 malformed envelope)이면 ProxyError throw.
 */
export async function callBackend<T>(req: NextRequest, opts: ProxyOptions): Promise<T> {
  const base = backendBaseUrl();

  // memberId 쿼리 제거 (real 백엔드는 JWT 로 식별)
  const qs = new URLSearchParams(opts.searchParams ?? []);
  qs.delete('memberId');
  const qsStr = qs.toString();

  const url = `${base}${opts.path}${qsStr ? `?${qsStr}` : ''}`;

  const auth = req.headers.get('authorization');
  const headers: Record<string, string> = {};
  if (auth) headers.authorization = auth;
  if (opts.body !== undefined) headers['content-type'] = 'application/json';

  const res = await fetch(url, {
    method: opts.method,
    headers,
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
    cache: 'no-store',
  });

  // 비 2xx — 에러 body 읽고 throw
  if (!res.ok) {
    const text = await res.text();
    const errJson = text ? (JSON.parse(text) as { message?: string; error?: string }) : {};
    throw new ProxyError(errJson.message ?? errJson.error ?? `Backend ${res.status}`, res.status);
  }

  // 204 No Content — 정상 void 응답 (body 없음)
  if (res.status === 204) return undefined as T;

  const text = await res.text();
  const json: unknown = text ? JSON.parse(text) : {};
  const envelope = json as { success?: boolean; data?: T; message?: string };

  if (envelope.success === false) {
    throw new ProxyError(envelope.message ?? 'Backend 응답 실패', 502);
  }
  // envelope 형식 미충족 (success 필드 없음) — malformed 로 간주
  if (envelope.success !== true) {
    throw new ProxyError('Backend 응답 형식이 올바르지 않습니다', 502);
  }
  // success:true + data 없음 = void (ResponseInterceptor 가 undefined data 를 JSON drop)
  return envelope.data as T;
}

export class ProxyError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
  }
}

/** ProxyError → NextResponse 헬퍼. catch 블록에서 사용. */
export function proxyErrorToResponse(e: unknown): NextResponse {
  if (e instanceof ProxyError) {
    return NextResponse.json({ error: e.message }, { status: e.status });
  }
  const msg = e instanceof Error ? e.message : 'Unknown proxy error';
  return NextResponse.json({ error: msg }, { status: 500 });
}

/**
 * Partner Backend BFF 어댑터.
 *
 * PO 의 `/api/procedures/*` Next.js route handler 가 mock(data-store) 과 real(백엔드)
 * 사이를 전환할 때 공통 유틸. 다음 3가지를 담당한다:
 *
 *   1. `API_MODE` env 로 모드 판단 (기본 'mock')
 *   2. 백엔드 요청 — Authorization 헤더 자동 전달, `?memberId=` 쿼리 제거
 *   3. 응답 언래핑 — 백엔드 envelope `{ success, data, timestamp }` → `data`
 *
 * ResponseInterceptor (글로벌) 가 씌운 envelope 는 여기서 벗기고, 라우트 핸들러가
 * PO 클라이언트 기존 계약 (`{ ok: true, ... }`) 에 맞춰 재포장한다.
 */

import { NextRequest, NextResponse } from 'next/server';

export function isRealMode(): boolean {
  return process.env.API_MODE === 'real';
}

/** 백엔드 base URL. ex) http://localhost:3002/partner/api/v1 */
function backendBaseUrl(): string {
  const url = process.env.BACKEND_URL;
  if (!url) {
    throw new Error('BACKEND_URL env 가 설정되지 않았습니다 (API_MODE=real 시 필수)');
  }
  return url.replace(/\/$/, '');
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
 * 성공(`{ success: true, data: T }`)이면 `data` 반환.
 * 실패(non-2xx 또는 `{ success: false }`)이면 Error throw — route handler 가 catch 해서 적절한 상태코드로 변환.
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
    // next: { revalidate: 0 },  // 항상 프레시 — 런타임 실시간 데이터
    cache: 'no-store',
  });

  const text = await res.text();
  const json: unknown = text ? JSON.parse(text) : {};

  if (!res.ok) {
    const err = json as { message?: string; error?: string };
    throw new ProxyError(err.message ?? err.error ?? `Backend ${res.status}`, res.status);
  }

  const envelope = json as { success?: boolean; data?: T; message?: string };
  if (envelope.success === false) {
    throw new ProxyError(envelope.message ?? 'Backend 응답 실패', 502);
  }
  return (envelope.data ?? ({} as T)) as T;
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

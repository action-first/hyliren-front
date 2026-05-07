import { ApiError } from './errors';

/**
 * BO BFF client.
 *
 * BO 의 모든 API 호출은 same-origin `/api/admin/*` route handler 경유.
 * 토큰은 httpOnly cookie 라 별도 Authorization 헤더 주입 불필요 — fetch credentials 'include'
 * 면 쿠키 자동 송신.
 *
 * FO/PO 의 client.ts 와 다른 점:
 *  - base URL 환경변수 없음 (same-origin)
 *  - 토큰 store 없음 (cookie 가 단일 진실원천)
 *  - refresh 로직 없음 (단일 만료, 만료 시 재로그인)
 *
 * 향후 real BE 전환 시: route handler 가 backend 로 proxy 해주므로 본 모듈 변경 X.
 */

interface Envelope<T> {
  success: boolean;
  data?: T;
  statusCode?: number;
  message?: string | string[];
  error?: string;
}

export interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
}

async function parseEnvelope<T>(res: Response): Promise<Envelope<T>> {
  const text = await res.text();
  if (!text) return { success: res.ok };
  try {
    return JSON.parse(text) as Envelope<T>;
  } catch {
    return { success: false, message: text };
  }
}

function coalesceMessage(envelope: Envelope<unknown>): string {
  if (Array.isArray(envelope.message)) return envelope.message[0] ?? '알 수 없는 오류';
  return envelope.message ?? envelope.error ?? '알 수 없는 오류';
}

export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { body, headers, ...init } = options;

  const finalHeaders = new Headers(headers);
  finalHeaders.set('Accept', 'application/json');

  let encodedBody: BodyInit | undefined;
  if (body !== undefined && body !== null) {
    if (body instanceof FormData || body instanceof Blob || typeof body === 'string') {
      encodedBody = body;
    } else {
      if (!finalHeaders.has('Content-Type')) finalHeaders.set('Content-Type', 'application/json');
      encodedBody = JSON.stringify(body);
    }
  }

  let res: Response;
  try {
    res = await fetch(path, {
      ...init,
      headers: finalHeaders,
      body: encodedBody,
      cache: 'no-store',
      credentials: 'same-origin',
    });
  } catch (err) {
    throw ApiError.network(err instanceof Error ? err.message : '네트워크 오류');
  }

  const envelope = await parseEnvelope<T>(res);
  if (!res.ok || !envelope.success) {
    const code = typeof envelope.error === 'string' ? envelope.error : String(envelope.statusCode ?? res.status);
    throw new ApiError(res.status, code, coalesceMessage(envelope));
  }

  return envelope.data as T;
}

import { env } from '@/lib/env';
import { partnerTokenStore } from '@/lib/auth/token-store';
import { ApiError } from './errors';

interface Envelope<T> {
  success: boolean;
  data?: T;
  statusCode?: number;
  message?: string | string[];
  error?: string;
}

interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

// Refresh 동시성 제어 — 401 폭주 시 refresh는 단 한 번만 실행된다.
let refreshPromise: Promise<TokenPair> | null = null;
let loggingOut = false;

// 강제 로그아웃 훅 (Store가 여기 구독한다 — 회로 분리)
type ForcedLogoutReason = 'refresh_failed' | 'no_refresh_token' | 'storage_sync';
const logoutListeners = new Set<(reason: ForcedLogoutReason) => void>();

export function onForcedLogout(listener: (reason: ForcedLogoutReason) => void): () => void {
  logoutListeners.add(listener);
  return () => { logoutListeners.delete(listener); };
}

function notifyForcedLogout(reason: ForcedLogoutReason): void {
  if (loggingOut) { return; }
  loggingOut = true;
  partnerTokenStore.clearTokens();
  logoutListeners.forEach((listener) => {
    try { listener(reason); } catch { /* swallow — listener errors must not break auth flow */ }
  });
  loggingOut = false;
}

async function parseEnvelope<T>(res: Response): Promise<Envelope<T>> {
  const text = await res.text();
  if (!text) { return { success: res.ok }; }
  try {
    return JSON.parse(text) as Envelope<T>;
  } catch {
    return { success: false, message: text };
  }
}

function coalesceMessage(envelope: Envelope<unknown>): string {
  if (Array.isArray(envelope.message)) {
    return envelope.message[0] ?? 'Unknown error';
  }
  return envelope.message ?? envelope.error ?? 'Unknown error';
}

async function runRefresh(): Promise<TokenPair> {
  const refreshToken = partnerTokenStore.getRefreshToken();
  if (!refreshToken) {
    throw new ApiError(401, 'NO_REFRESH_TOKEN', 'No refresh token available');
  }

  const res = await fetch(`${env.partnerApiBaseUrl}/auth/refresh`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({ refreshToken }),
    cache: 'no-store',
  });

  const envelope = await parseEnvelope<TokenPair>(res);
  if (!res.ok || !envelope.success || !envelope.data) {
    throw new ApiError(res.status, 'REFRESH_FAILED', coalesceMessage(envelope));
  }

  partnerTokenStore.setTokens(envelope.data);
  return envelope.data;
}

async function refreshOnce(): Promise<TokenPair> {
  if (!refreshPromise) {
    refreshPromise = runRefresh().finally(() => { refreshPromise = null; });
  }
  return refreshPromise;
}

export interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
  /** 기본 true. false이면 Authorization 미첨부. */
  auth?: boolean;
  /** 내부 전용 — 재시도 재귀 방지. 직접 사용하지 말 것. */
  skipRefresh?: boolean;
}

export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { auth = true, skipRefresh = false, body, headers, ...init } = options;

  const finalHeaders = new Headers(headers);
  finalHeaders.set('Accept', 'application/json');

  let encodedBody: BodyInit | undefined;
  if (body !== undefined && body !== null) {
    if (body instanceof FormData || body instanceof Blob || typeof body === 'string') {
      encodedBody = body;
    } else {
      if (!finalHeaders.has('Content-Type')) {
        finalHeaders.set('Content-Type', 'application/json');
      }
      encodedBody = JSON.stringify(body);
    }
  }

  if (auth) {
    const token = partnerTokenStore.getAccessToken();
    if (token) { finalHeaders.set('Authorization', `Bearer ${token}`); }
  }

  let res: Response;
  try {
    res = await fetch(`${env.partnerApiBaseUrl}${path}`, {
      ...init,
      headers: finalHeaders,
      body: encodedBody,
      cache: 'no-store',
    });
  } catch (err) {
    throw ApiError.network(err instanceof Error ? err.message : 'Network error');
  }

  if (res.status === 401 && auth && !skipRefresh && !loggingOut) {
    try {
      await refreshOnce();
    } catch {
      notifyForcedLogout('refresh_failed');
      throw new ApiError(401, 'UNAUTHORIZED', 'Session expired');
    }
    return request<T>(path, { ...options, skipRefresh: true });
  }

  const envelope = await parseEnvelope<T>(res);
  if (!res.ok || !envelope.success) {
    const code = typeof envelope.error === 'string' ? envelope.error : String(envelope.statusCode ?? res.status);
    throw new ApiError(res.status, code, coalesceMessage(envelope));
  }

  return envelope.data as T;
}

export function setTokens(tokens: TokenPair): void {
  partnerTokenStore.setTokens(tokens);
}

export function clearTokens(): void {
  partnerTokenStore.clearTokens();
}

import { env } from '@/lib/env';
import { adminTokenStore } from '@/lib/auth/token-store';
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

let refreshPromise: Promise<TokenPair> | null = null;
let loggingOut = false;

type ForcedLogoutReason = 'refresh_failed' | 'no_refresh_token' | 'storage_sync';
const logoutListeners = new Set<(reason: ForcedLogoutReason) => void>();

export function onForcedLogout(listener: (reason: ForcedLogoutReason) => void): () => void {
  logoutListeners.add(listener);
  return () => { logoutListeners.delete(listener); };
}

function notifyForcedLogout(reason: ForcedLogoutReason): void {
  if (loggingOut) return;
  loggingOut = true;
  adminTokenStore.clearTokens();
  logoutListeners.forEach((listener) => {
    try { listener(reason); } catch { /* swallow — listener errors must not break auth flow */ }
  });
  loggingOut = false;
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

async function runRefresh(): Promise<TokenPair> {
  const refreshToken = adminTokenStore.getRefreshToken();
  if (!refreshToken) {
    throw new ApiError(401, 'NO_REFRESH_TOKEN', 'No refresh token available');
  }

  const res = await fetch(`${env.adminApiBaseUrl}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ refreshToken }),
    cache: 'no-store',
  });

  const envelope = await parseEnvelope<TokenPair>(res);
  if (!res.ok || !envelope.success || !envelope.data) {
    throw new ApiError(res.status, 'REFRESH_FAILED', coalesceMessage(envelope));
  }

  adminTokenStore.setTokens(envelope.data);
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
  /** 기본 true. false이면 Authorization 미첨부 (login 등). */
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
      if (!finalHeaders.has('Content-Type')) finalHeaders.set('Content-Type', 'application/json');
      encodedBody = JSON.stringify(body);
    }
  }

  if (auth) {
    const token = adminTokenStore.getAccessToken();
    if (token) finalHeaders.set('Authorization', `Bearer ${token}`);
  }

  let res: Response;
  try {
    res = await fetch(`${env.adminApiBaseUrl}${path}`, {
      ...init,
      headers: finalHeaders,
      body: encodedBody,
      cache: 'no-store',
    });
  } catch (err) {
    throw ApiError.network(err instanceof Error ? err.message : '네트워크 오류');
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
  adminTokenStore.setTokens(tokens);
}

export function clearTokens(): void {
  adminTokenStore.clearTokens();
}

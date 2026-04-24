import { NextResponse } from 'next/server';

function partnerBaseUrl(): string {
  const raw = process.env.PARTNER_BACKEND_URL ?? process.env.BACKEND_URL;
  if (!raw) {
    throw new Error('PARTNER_BACKEND_URL 또는 BACKEND_URL env 가 필요합니다');
  }

  const trimmed = raw.replace(/\/$/, '');
  if (trimmed.endsWith('/partner/api/v1')) return trimmed.slice(0, -'/api/v1'.length);
  if (trimmed.endsWith('/partner')) return trimmed;
  return `${trimmed}/partner`;
}

export async function callPartnerAuth<T>(
  path: '/auth/login' | '/auth/refresh' | '/auth/logout' | '/auth/me',
  init: RequestInit,
): Promise<T> {
  const res = await fetch(`${partnerBaseUrl()}${path}`, {
    ...init,
    cache: 'no-store',
  });

  if (res.status === 204) {
    return undefined as T;
  }

  const text = await res.text();
  const json: unknown = text ? JSON.parse(text) : {};
  if (!res.ok) {
    const err = json as { message?: string | string[]; error?: string };
    const message = Array.isArray(err.message) ? err.message[0] : err.message;
    throw new PartnerAuthProxyError(message ?? err.error ?? `Backend ${res.status}`, res.status);
  }

  const envelope = json as { success?: boolean; data?: T; message?: string };
  if (envelope.success === false) {
    throw new PartnerAuthProxyError(envelope.message ?? '인증 요청에 실패했습니다', 502);
  }
  if (envelope.success !== true) {
    throw new PartnerAuthProxyError('인증 응답 형식이 올바르지 않습니다', 502);
  }
  return envelope.data as T;
}

export class PartnerAuthProxyError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
  }
}

export function authProxyErrorToResponse(e: unknown): NextResponse {
  if (e instanceof PartnerAuthProxyError) {
    return NextResponse.json({ error: e.message }, { status: e.status });
  }
  const message = e instanceof Error ? e.message : 'Unknown auth proxy error';
  return NextResponse.json({ error: message }, { status: 500 });
}

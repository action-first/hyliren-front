import type { Member } from '@hyliren/shared';
import { partnerTokenStore, type PartnerTokens } from '@/lib/auth/token-store';

interface PartnerMeWire {
  memberId: string;
  role: 'partner';
  email: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface PartnerLoginInput {
  email: string;
  password: string;
}

let refreshPromise: Promise<PartnerTokens> | null = null;

function toMember(wire: PartnerMeWire): Member {
  return {
    id: wire.memberId,
    role: wire.role,
    email: wire.email,
    name: wire.name,
    createdAt: wire.createdAt,
    updatedAt: wire.updatedAt,
  };
}

async function parseJson<T>(res: Response): Promise<T> {
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error ?? data.message ?? `HTTP ${res.status}`);
  }
  return data as T;
}

export async function login(input: PartnerLoginInput): Promise<Member> {
  const tokens = await parseJson<PartnerTokens>(await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  }));
  partnerTokenStore.setTokens(tokens);
  return fetchMe();
}

async function runRefresh(): Promise<PartnerTokens> {
  const refreshToken = partnerTokenStore.getRefreshToken();
  if (!refreshToken) throw new Error('로그인이 필요합니다');

  const tokens = await parseJson<PartnerTokens>(await fetch('/api/auth/refresh', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  }));
  partnerTokenStore.setTokens(tokens);
  return tokens;
}

export async function refreshTokens(): Promise<PartnerTokens> {
  if (!refreshPromise) {
    refreshPromise = runRefresh().finally(() => { refreshPromise = null; });
  }
  return refreshPromise;
}

export async function fetchMe(): Promise<Member> {
  const token = partnerTokenStore.getAccessToken();
  if (!token) throw new Error('로그인이 필요합니다');

  const me = await parseJson<PartnerMeWire>(await fetch('/api/auth/me', {
    headers: { Authorization: `Bearer ${token}` },
  }));
  return toMember(me);
}

export async function logout(): Promise<void> {
  const token = partnerTokenStore.getAccessToken();
  try {
    if (token) {
      const res = await fetch('/api/auth/logout', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
    }
  } finally {
    partnerTokenStore.clearTokens();
  }
}

/**
 * Admin Auth API client — direct backend 호출 (BFF 미경유).
 * FO 의 `lib/api/auth.ts` / PO 의 `lib/api/partner-auth.ts` 와 동일 컨벤션.
 * 토큰 저장은 client.ts (adminTokenStore localStorage) 가 담당.
 */
import type { Member } from '@hyliren/shared';
import { request, setTokens, clearTokens } from './client';

interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

interface AdminMeWire {
  memberId: string;
  role: 'admin';
  email: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface AdminLoginInput {
  email: string;
  password: string;
}

function toMember(wire: AdminMeWire): Member {
  return {
    id: wire.memberId,
    role: wire.role,
    email: wire.email,
    name: wire.name,
    createdAt: wire.createdAt,
    updatedAt: wire.updatedAt,
  };
}

export async function login(input: AdminLoginInput): Promise<Member> {
  const tokens = await request<TokenPair>('/auth/login', {
    method: 'POST',
    auth: false,
    body: input,
  });
  setTokens(tokens);
  return fetchMe();
}

export async function fetchMe(): Promise<Member> {
  const wire = await request<AdminMeWire>('/auth/me', { method: 'GET' });
  return toMember(wire);
}

export async function logout(): Promise<void> {
  try {
    await request<void>('/auth/logout', { method: 'POST' });
  } finally {
    clearTokens();
  }
}

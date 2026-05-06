import type { Member } from '@hyliren/shared';
import { request } from './client';

/**
 * Admin Auth API — same-origin BFF (/api/admin/auth/*) 호출.
 * 토큰 cookie 는 BFF 가 자동 set/clear, 클라이언트는 응답 본문의 member 만 사용.
 */

export interface AdminLoginInput {
  email: string;
  password: string;
}

interface MeResponse {
  member: Member;
}

interface LoginResponse {
  member: Member;
}

export async function login(input: AdminLoginInput): Promise<Member> {
  const res = await request<LoginResponse>('/api/admin/auth/login', {
    method: 'POST',
    body: { email: input.email.trim().toLowerCase(), password: input.password },
  });
  return res.member;
}

export async function fetchMe(): Promise<Member> {
  const res = await request<MeResponse>('/api/admin/auth/me', { method: 'GET' });
  return res.member;
}

export async function logout(): Promise<void> {
  await request<null>('/api/admin/auth/logout', { method: 'POST' });
}

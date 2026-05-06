import type { Member } from '@hyliren/shared';
import { readServerAuthEnv, assertReadyForRuntime } from './env';

/**
 * Email → AdminMember resolve.
 *
 * mock 모드: env BO_DEV_ADMIN_EMAIL/NAME 와 일치하면 가상 admin Member 반환.
 * real 모드: BACKEND `/admin/auth/me` proxy 호출.
 *
 * BFF route handler (login·me) 가 token verify 후 본 함수 호출 → admin 정보 응답.
 */
export async function resolveAdminByEmail(email: string): Promise<Member | null> {
  const env = readServerAuthEnv();
  assertReadyForRuntime(env);

  if (env.mode === 'mock') {
    if (!env.devAdminEmail || email !== env.devAdminEmail) return null;
    const now = new Date().toISOString();
    return {
      id: 'admin-dev-001',
      role: 'admin',
      email: env.devAdminEmail,
      name: env.devAdminName,
      createdAt: now,
      updatedAt: now,
    };
  }

  // real 모드 — backend 의 admin lookup endpoint proxy.
  // 실 BE 구현 전까지 미연결. 실제 호출 시 ENV 검증 통과 + endpoint 부재로 401 반환됨.
  if (!env.backendUrl) return null;
  try {
    const res = await fetch(`${env.backendUrl}/admin/users/by-email?email=${encodeURIComponent(email)}`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      cache: 'no-store',
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { success: boolean; data?: Member };
    return json.success && json.data ? json.data : null;
  } catch {
    return null;
  }
}

/**
 * 로그인 자격 검증.
 *
 * mock 모드: env 의 평문 비밀번호와 정확히 일치할 때만 통과.
 * real 모드: BACKEND `/admin/auth/login` proxy.
 *
 * 실패 시 null 반환. 호출자가 401 envelope 변환.
 */
export async function authenticateAdmin(
  email: string,
  password: string,
): Promise<Member | null> {
  const env = readServerAuthEnv();
  assertReadyForRuntime(env);

  if (env.mode === 'mock') {
    if (
      !env.devAdminEmail ||
      !env.devAdminPassword ||
      email !== env.devAdminEmail ||
      password !== env.devAdminPassword
    ) {
      return null;
    }
    return resolveAdminByEmail(email);
  }

  if (!env.backendUrl) return null;
  try {
    const res = await fetch(`${env.backendUrl}/admin/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ email, password }),
      cache: 'no-store',
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { success: boolean; data?: { member: Member } };
    return json.success && json.data?.member ? json.data.member : null;
  } catch {
    return null;
  }
}

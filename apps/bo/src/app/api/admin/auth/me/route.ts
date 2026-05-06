import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { readServerAuthEnv } from '@/lib/server/auth/env';
import { verifySession } from '@/lib/server/auth/token';
import { resolveAdminByEmail } from '@/lib/server/auth/admin-resolver';

/**
 * GET /api/admin/auth/me
 *
 * cookie bo-session 검증 → admin Member 응답.
 * 실패: 401 (cookie 부재·만료·서명 실패) — 클라이언트 BOSessionBootstrap 가
 * 401 받으면 store 를 guest 로 둠.
 */
export async function GET() {
  const env = readServerAuthEnv();
  const cookieStore = await cookies();
  const token = cookieStore.get(env.cookieName)?.value;
  if (!token) {
    return NextResponse.json(
      { success: false, error: 'NO_SESSION', message: '세션이 없습니다.' },
      { status: 401 },
    );
  }

  const session = await verifySession(env.secret, token);
  if (!session) {
    return NextResponse.json(
      { success: false, error: 'INVALID_SESSION', message: '세션이 만료되었거나 유효하지 않습니다.' },
      { status: 401 },
    );
  }

  const member = await resolveAdminByEmail(session.email);
  if (!member || member.role !== 'admin') {
    return NextResponse.json(
      { success: false, error: 'NOT_ADMIN', message: 'admin 권한이 확인되지 않습니다.' },
      { status: 401 },
    );
  }

  return NextResponse.json({ success: true, data: { member } });
}

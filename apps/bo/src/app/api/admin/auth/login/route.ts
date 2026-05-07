import { NextResponse } from 'next/server';
import { readServerAuthEnv } from '@/lib/server/auth/env';
import { signSession } from '@/lib/server/auth/token';
import { authenticateAdmin } from '@/lib/server/auth/admin-resolver';

/**
 * POST /api/admin/auth/login
 *
 * body: { email, password }
 * → 성공: 200 { success: true, data: { member } } + Set-Cookie bo-session (httpOnly)
 * → 실패: 401 { success: false, error: 'INVALID_CREDENTIALS', message }
 *
 * cookie: httpOnly · SameSite=Strict · Secure(prod) · Path=/. JS 접근 불가.
 */

interface LoginBody {
  email?: unknown;
  password?: unknown;
}

export async function POST(req: Request) {
  let body: LoginBody;
  try {
    body = (await req.json()) as LoginBody;
  } catch {
    return NextResponse.json(
      { success: false, error: 'INVALID_BODY', message: '요청 본문이 잘못되었습니다.' },
      { status: 400 },
    );
  }

  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const password = typeof body.password === 'string' ? body.password : '';
  if (!email || !password) {
    return NextResponse.json(
      { success: false, error: 'MISSING_FIELDS', message: '이메일과 비밀번호를 입력해주세요.' },
      { status: 400 },
    );
  }

  const member = await authenticateAdmin(email, password);
  if (!member) {
    return NextResponse.json(
      { success: false, error: 'INVALID_CREDENTIALS', message: '이메일 또는 비밀번호가 올바르지 않습니다.' },
      { status: 401 },
    );
  }
  if (member.role !== 'admin') {
    return NextResponse.json(
      { success: false, error: 'NOT_ADMIN', message: 'admin 권한이 없습니다.' },
      { status: 403 },
    );
  }

  const env = readServerAuthEnv();
  const token = await signSession(env.secret, member.email, env.sessionTtlMs);

  const res = NextResponse.json({ success: true, data: { member } });
  res.cookies.set({
    name: env.cookieName,
    value: token,
    httpOnly: true,
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: Math.floor(env.sessionTtlMs / 1000),
  });
  return res;
}

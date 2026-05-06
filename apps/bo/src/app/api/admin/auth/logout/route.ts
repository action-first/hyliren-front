import { NextResponse } from 'next/server';
import { readServerAuthEnv } from '@/lib/server/auth/env';

/**
 * POST /api/admin/auth/logout
 *
 * bo-session cookie 즉시 만료 (Set-Cookie Max-Age=0). 항상 200 응답.
 */
export async function POST() {
  const env = readServerAuthEnv();
  const res = NextResponse.json({ success: true, data: null });
  res.cookies.set({
    name: env.cookieName,
    value: '',
    httpOnly: true,
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 0,
  });
  return res;
}

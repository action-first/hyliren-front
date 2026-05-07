import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifySession } from '@/lib/server/auth/token';

/**
 * BO SSR-level auth gate.
 *
 * 모든 페이지 요청 (login·api 제외) 에서 cookie bo-session 검증.
 *  - 미존재/만료/위변조 → /login?next=<원래경로>
 *  - 통과 → 그대로 렌더
 *
 * client-only AuthGate 보다 한 단계 위 — flicker 없이 즉시 redirect.
 *
 * 주의: middleware 는 Edge runtime → 본 모듈이 import 하는 token.ts 는
 * Web Crypto 사용 (Node.js crypto X). 설계 그대로 호환됨.
 */

const PUBLIC_PATHS = ['/login'];

const COOKIE_NAME = process.env.BO_SESSION_COOKIE ?? 'bo-session';
const SECRET = process.env.BO_AUTH_SECRET ?? '';

function isPublic(pathname: string): boolean {
  if (PUBLIC_PATHS.includes(pathname)) return true;
  return false;
}

export async function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  if (isPublic(pathname)) {
    return NextResponse.next();
  }

  const token = req.cookies.get(COOKIE_NAME)?.value;
  const session = token && SECRET ? await verifySession(SECRET, token) : null;

  if (!session) {
    const loginUrl = req.nextUrl.clone();
    loginUrl.pathname = '/login';
    loginUrl.search = `?next=${encodeURIComponent(pathname + (search || ''))}`;
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

/**
 * matcher — middleware 적용 범위.
 *  - 정적 자산 (_next/static, _next/image, favicon, public) 제외
 *  - api/admin/auth/* 도 통과 (login 자체는 토큰 없을 때 호출되어야 함)
 *  - 그 외 모든 경로 검사
 */
export const config = {
  matcher: [
    '/((?!api/admin/auth|_next/static|_next/image|icon\\.svg|favicon\\.ico).*)',
  ],
};

import { NextResponse, type NextRequest } from 'next/server';
import { isLocale, parseAcceptLanguage, type Locale } from '@hyliren/shared';

/**
 * FO i18n routing middleware — path 기반 SSOT.
 *
 * 진입 시점에 모든 경로를 `/{lang}/...` 형태로 강제. 결정 우선순위:
 *   1. path 의 첫 segment 가 valid Locale 이면 통과 (+ cookie 동기화)
 *   2. cookie `mimyo-locale` (사용자 명시 선택 흔적)
 *   3. Accept-Language 헤더 (브라우저 설정 언어 — RFC 7231 §5.3.5 매칭)
 *   4. fallback `'zh-CN'` (Customer 앱 주력 시장)
 *
 * Note: GeoIP 등 IP 기반 분기는 사용하지 않음 — VPN/해외 거주자 부정확 + 개인정보 범위 확대.
 */

const COOKIE_NAME = 'mimyo-locale';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1년
const FALLBACK_LOCALE: Locale = 'zh-CN';

function resolveLocaleFromRequest(request: NextRequest): Locale {
  // 1. cookie 우선 (사용자 명시 선택 존중)
  const fromCookie = request.cookies.get(COOKIE_NAME)?.value;
  if (fromCookie && isLocale(fromCookie)) return fromCookie;

  // 2. Accept-Language (브라우저 설정 언어)
  const acceptLang = request.headers.get('accept-language');
  if (acceptLang) {
    const parsed = parseAcceptLanguage(acceptLang);
    if (parsed) return parsed;
  }

  // 3. fallback
  return FALLBACK_LOCALE;
}

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const segments = pathname.split('/').filter(Boolean);
  const first = segments[0];

  // path 가 valid lang prefix 를 가진 경우 → 통과 + cookie 동기화
  if (first && isLocale(first)) {
    // RSC layout 이 pathname 을 알도록 헤더 주입 (canonical/hreflang 메타 생성용).
    // Next 15 의 generateMetadata 는 dynamic params 만 받고 children path 는 모르므로
    // middleware 가 명시 주입.
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-pathname', pathname);

    const response = NextResponse.next({ request: { headers: requestHeaders } });
    // cookie 가 path lang 과 다르면 동기화
    // (사용자가 직접 다른 lang URL 로 진입했거나, 명시 선택 후 redirect 된 경우 일관성 보장)
    const currentCookie = request.cookies.get(COOKIE_NAME)?.value;
    if (currentCookie !== first) {
      response.cookies.set(COOKIE_NAME, first, {
        path: '/',
        maxAge: COOKIE_MAX_AGE,
        sameSite: 'lax',
      });
    }
    return response;
  }

  // path 에 lang prefix 없음 → 결정 후 redirect
  const locale = resolveLocaleFromRequest(request);
  const url = request.nextUrl.clone();
  url.pathname = `/${locale}${pathname === '/' ? '' : pathname}`;
  const response = NextResponse.redirect(url, { status: 307 });
  // redirect 응답에 cookie 동봉 — 다음 요청부터 cookie 사용 가능
  response.cookies.set(COOKIE_NAME, locale, {
    path: '/',
    maxAge: COOKIE_MAX_AGE,
    sameSite: 'lax',
  });
  return response;
}

export const config = {
  /**
   * static asset / API / Next 내부 경로 제외.
   * `/opengraph-image` 같은 [lang] 하위 동적 라우트는 포함되어야 하므로
   * 명시적 root 정적 파일만 제외.
   */
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|icon.svg|robots.txt|sitemap.xml|manifest.json).*)',
  ],
};

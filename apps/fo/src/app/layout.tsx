import type { Viewport } from 'next';
import { getLocaleFromCookie } from '@/lib/server-locale';
import './globals.css';

/**
 * Root layout — html/body shell 만 담당.
 *
 * locale 결정의 SSOT 는 path (`[lang]` segment) 이고 middleware 가 모든 진입을
 * `/{lang}/...` 로 강제한다. 다만 root layout 은 dynamic params 를 직접 받지 못하므로
 * middleware 가 동기화한 cookie `mimyo-locale` 로 `<html lang>` 을 결정한다.
 *
 * 첫 진입(redirect 직전)이라도 middleware 의 redirect 응답에 Set-Cookie 가 동봉되어
 * 브라우저가 재요청 시점부턴 cookie 가 SSOT path lang 과 정합된다.
 */

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover',
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocaleFromCookie();
  return (
    <html lang={locale} data-theme="fo">
      <body>{children}</body>
    </html>
  );
}

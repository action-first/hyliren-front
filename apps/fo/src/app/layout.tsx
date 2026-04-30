import type { Metadata, Viewport } from 'next';
import { t } from '@hyliren/i18n';
import './globals.css';
import { FOHeader } from '@/components/layout/FOHeader';
import { FOTabBar } from '@/components/layout/FOTabBar';

import Toast from '@/components/common/Toast';
import { SessionBootstrap } from '@/components/auth/SessionBootstrap';
import { getServerLocale } from '@/lib/server-locale';

/**
 * SSR locale 기반 metadata — Customer 앱.
 *
 * 우선순위(getServerLocale): cookie `mimyo-locale` → Accept-Language → 'zh-CN' fallback.
 * 검색엔진/소셜 미리보기가 첫 응답에서 locale 별 정확한 메타를 받음.
 */
export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerLocale();
  return {
    title: t(locale, 'metadata.title'),
    description: t(locale, 'metadata.description'),
  };
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover',
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getServerLocale();
  return (
    <html lang={locale} data-theme="fo">
      <body>
        <SessionBootstrap />
        <div className="fo-shell">
          <div className="fo-frame">
            <FOHeader />
            <main className="fo-main">
              {children}
            </main>
          </div>
        </div>
        {/* 하단 탭바 — fixed로 항상 플로팅 */}
        <FOTabBar />
        <Toast />
      </body>
    </html>
  );
}

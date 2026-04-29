import type { Metadata, Viewport } from 'next';
import './globals.css';
import { FOHeader } from '@/components/layout/FOHeader';
import { FOTabBar } from '@/components/layout/FOTabBar';

import Toast from '@/components/common/Toast';
import { SessionBootstrap } from '@/components/auth/SessionBootstrap';

// metadata 는 server-side fixed text (SEO 용). locale 별 분기는 향후 i18n routing 도입 시 처리.
export const metadata: Metadata = {
  title: '미묘 (MIMYO) — 나에게 맞는 시술, 병원이 먼저 제안합니다',
  description: 'K-성형 의사결정 플랫폼. 고민을 등록하면 검증된 한국 병원이 맞춤 제안서를 보내드립니다.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" data-theme="fo">
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

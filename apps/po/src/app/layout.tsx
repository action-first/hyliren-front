import type { Metadata } from 'next';
import { Suspense } from 'react';
import './globals.css';
import Toast from '@/components/common/Toast';
import { QueryProvider } from '@/components/common/QueryProvider';
import { PartnerSessionBootstrap } from '@/components/auth/PartnerSessionBootstrap';
import { PartnerAuthGate } from '@/components/auth/PartnerAuthGate';

// metadata 는 server-side fixed text. locale 별 분기는 향후 i18n routing 도입 시 처리.
export const metadata: Metadata = {
  title: '미묘 파트너 오피스 (MIMYO Partner Office)',
  description: '병원 관리 시스템',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" data-theme="admin">
      <head>
        <link rel="stylesheet" as="style" crossOrigin="anonymous" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css" />
      </head>
      <body>
        <QueryProvider>
          <PartnerSessionBootstrap />
          <Suspense fallback={null}>
            <PartnerAuthGate>{children}</PartnerAuthGate>
          </Suspense>
          <Toast />
        </QueryProvider>
      </body>
    </html>
  );
}

import type { Metadata } from 'next';
import { Suspense } from 'react';
import './globals.css';
import Toast from '@/components/common/Toast';
import { BOSessionBootstrap } from '@/components/auth/BOSessionBootstrap';
import { BOAuthGate } from '@/components/auth/BOAuthGate';

export const metadata: Metadata = {
  title: 'MIMYO 비즈니스 오피스',
  description: '내부 관리 시스템',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" data-theme="admin">
      <head>
        <link
          rel="stylesheet"
          as="style"
          crossOrigin="anonymous"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css"
        />
      </head>
      <body>
        <BOSessionBootstrap />
        <Suspense fallback={null}>
          <BOAuthGate>{children}</BOAuthGate>
        </Suspense>
        <Toast />
      </body>
    </html>
  );
}

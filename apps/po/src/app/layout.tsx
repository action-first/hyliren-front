import type { Metadata } from 'next';
import './globals.css';
import Toast from '@/components/common/Toast';

export const metadata: Metadata = {
  title: '한옌리런 파트너 오피스',
  description: '병원 관리 시스템',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" data-theme="admin">
      <head>
        <link rel="stylesheet" as="style" crossOrigin="anonymous" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css" />
      </head>
      <body>
        {children}
        <Toast />
      </body>
    </html>
  );
}

import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '한옌리런 파트너 오피스',
  description: '병원 관리 시스템',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}

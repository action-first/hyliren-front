import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '한옌리런 비즈니스 오피스',
  description: '내부 관리 시스템',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" data-theme="admin">
      <body>{children}</body>
    </html>
  );
}

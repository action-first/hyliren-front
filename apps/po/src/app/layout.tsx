import type { Metadata } from 'next';
import { Suspense } from 'react';
import { t } from '@hyliren/i18n';
import './globals.css';
import Toast from '@/components/common/Toast';
import { QueryProvider } from '@/components/common/QueryProvider';
import { PartnerSessionBootstrap } from '@/components/auth/PartnerSessionBootstrap';
import { PartnerAuthGate } from '@/components/auth/PartnerAuthGate';
import { getServerLocale } from '@/lib/server-locale';

/**
 * SSR locale 기반 metadata — Partner 앱.
 *
 * 우선순위(getServerLocale): cookie `mimyo-po-locale` → Accept-Language → 'ko' fallback.
 */
export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerLocale();
  return {
    title: t(locale, 'metadata.poTitle'),
    description: t(locale, 'metadata.poDescription'),
  };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getServerLocale();
  return (
    <html lang={locale} data-theme="admin">
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

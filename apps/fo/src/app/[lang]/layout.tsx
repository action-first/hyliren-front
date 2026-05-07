import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { isLocale, LOCALES, type Locale } from '@hyliren/shared';
import { t } from '@hyliren/i18n';
import { FOHeader } from '@/components/layout/FOHeader';
import { FOTabBar } from '@/components/layout/FOTabBar';
import Toast from '@/components/common/Toast';
import { SessionBootstrap } from '@/components/auth/SessionBootstrap';
import { LocaleStoreProvider } from '@/store/locale';

/**
 * `[lang]` layout — locale 별 본체 (FOHeader, FOTabBar, metadata 등).
 *
 * locale SSOT 는 `params.lang` (path). middleware 가 모든 진입을 `/{lang}/...` 로 강제하므로
 * 잘못된 lang 이 들어오는 경우는 직접 URL 진입(`/xx/...`) 정도뿐 — 그땐 notFound() 처리.
 */

export function generateStaticParams(): Array<{ lang: Locale }> {
  return LOCALES.map((lang) => ({ lang }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  const locale: Locale = isLocale(lang) ? lang : 'zh-CN';
  return {
    title: t(locale, 'metadata.title'),
    description: t(locale, 'metadata.description'),
  };
}

export default async function LangLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();

  return (
    <LocaleStoreProvider initialLocale={lang}>
      <SessionBootstrap />
      <div className="fo-shell">
        <div className="fo-frame">
          <FOHeader />
          <main className="fo-main">{children}</main>
        </div>
      </div>
      {/* 하단 탭바 — fixed 로 항상 플로팅 */}
      <FOTabBar />
      <Toast />
    </LocaleStoreProvider>
  );
}

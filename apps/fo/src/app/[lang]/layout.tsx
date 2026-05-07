import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import { isLocale, LOCALES, type Locale } from '@hyliren/shared';
import { t } from '@hyliren/i18n';
import { FOHeader } from '@/components/layout/FOHeader';
import { FOTabBar } from '@/components/layout/FOTabBar';
import Toast from '@/components/common/Toast';
import { SessionBootstrap } from '@/components/auth/SessionBootstrap';
import { LocaleStoreProvider } from '@/store/locale';
import { env } from '@/lib/env';

/** lang prefix 를 제거하여 페이지의 nested path 만 추출 ('/ko/concerns/123' → '/concerns/123'). */
function stripLangPrefix(pathname: string, lang: Locale): string {
  const prefix = `/${lang}`;
  if (pathname === prefix) return '';
  return pathname.startsWith(`${prefix}/`) ? pathname.slice(prefix.length) : '';
}

/**
 * 모든 lang 별 절대 URL 생성. hreflang alternates 노출용.
 *
 * @param restPath nested path (예: `/concerns/123`). 빈 문자열이면 root.
 */
function buildAlternates(restPath: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const l of LOCALES) {
    out[l] = `${env.siteUrl}/${l}${restPath}`;
  }
  // x-default — Customer 앱 주력(zh-CN) 으로 매칭. 검색엔진이 lang 매칭 실패 시 노출할 URL.
  out['x-default'] = `${env.siteUrl}/zh-CN${restPath}`;
  return out;
}

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

  // middleware 가 주입한 x-pathname 으로 nested path 추출.
  // 헤더 미존재(예: client navigation 후 RSC) 시엔 root path 로 fallback.
  const pathname = (await headers()).get('x-pathname') ?? `/${locale}`;
  const restPath = stripLangPrefix(pathname, locale);
  const canonical = `${env.siteUrl}/${locale}${restPath}`;
  const altText = t(locale, 'metadata.ogImageAlt');
  return {
    metadataBase: new URL(env.siteUrl),
    title: t(locale, 'metadata.title'),
    description: t(locale, 'metadata.description'),
    alternates: {
      canonical,
      languages: buildAlternates(restPath),
    },
    openGraph: {
      images: [{ url: `/${locale}/opengraph-image`, alt: altText }],
    },
    twitter: {
      images: [{ url: `/${locale}/opengraph-image`, alt: altText }],
    },
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

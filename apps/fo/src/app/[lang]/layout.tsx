import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import { isLocale, LOCALES, type Locale } from '@hyliren/shared';
import { t } from '@hyliren/i18n';
import { FOHeader } from '@/components/layout/FOHeader';
import { FOFooter } from '@/components/layout/FOFooter';
import { FOTabBar } from '@/components/layout/FOTabBar';
import { GoogleAnalytics } from '@/components/analytics/GoogleAnalytics';
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
 * 검색엔진 owner verification metadata.
 *
 * - `google` 은 Next.js 가 google-site-verification meta 로 자동 emit.
 * - `naver-site-verification` / `baidu-site-verification` 은 `other` 키에 raw name 그대로.
 * - 환경변수 토큰이 비어있으면 해당 키를 추가하지 않는다 → meta tag 미노출.
 *
 * Why: 토큰이 없을 때 빈 content="" meta 가 박히면 verification 실패 + lint warning.
 */
function buildVerification(): Metadata['verification'] | undefined {
  const result: NonNullable<Metadata['verification']> = {};
  if (env.verification.google) result.google = env.verification.google;
  const other: Record<string, string> = {};
  if (env.verification.naver) other['naver-site-verification'] = env.verification.naver;
  if (env.verification.baidu) other['baidu-site-verification'] = env.verification.baidu;
  if (Object.keys(other).length > 0) result.other = other;
  return Object.keys(result).length > 0 ? result : undefined;
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
  // openGraph / twitter images 는 명시 override 하지 않는다.
  //
  // Why:
  //   `app/[lang]/opengraph-image.tsx` 의 `generateImageMetadata` 가 lang 별 alt 와
  //   자동 hash suffix 가 포함된 URL (`/{lang}/opengraph-image/og?<hash>`) 을 생성
  //   → og:image 에 자동 적용. 단 manual override 를 하면 twitter:image 는 그 override
  //   를 그대로 사용해 suffix 가 빠진 URL (`/{lang}/opengraph-image`) 로 박힘 → 404.
  //   카카오톡/X 공유 미리보기 이미지가 깨짐 (실측 확인). manual override 제거 시
  //   Next 가 generateImageMetadata 결과를 og:image · twitter:image 양쪽에 자동 적용.
  return {
    metadataBase: new URL(env.siteUrl),
    title: t(locale, 'metadata.title'),
    description: t(locale, 'metadata.description'),
    alternates: {
      canonical,
      languages: buildAlternates(restPath),
    },
    verification: buildVerification(),
  };
}

/**
 * Organization schema.org JSON-LD — 모든 페이지에 1회 노출.
 *
 * 효과:
 *   - Google Knowledge Panel 자격 (브랜드명 검색 시 우측 박스 노출)
 *   - 검색결과 brand mention 시 logo / sameAs 링크 자동 매핑
 *   - Article 등 다른 JSON-LD 의 publisher 와 cross-reference
 *
 * Note: SNS 채널이 추가되면 sameAs 에 등록 → brand entity linking 강화.
 */
function buildOrganizationJsonLd(): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'MIMYO',
    alternateName: ['미묘', '美妙', 'ミミョ'],
    url: env.siteUrl,
    logo: `${env.siteUrl}/icon.svg`,
    description: '한국 K-뷰티 시술 매칭 플랫폼 — 슈링크·물광·리프팅·필러 등 20-30대 여성 시술 고민을 검증된 한국 병원이 직접 제안합니다.',
    sameAs: [
      // 향후 공식 SNS / 채널 추가 시 등록 (Instagram / X / 小红书 / Xiaohongshu 등)
    ],
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

  const organizationJsonLd = buildOrganizationJsonLd();

  return (
    <LocaleStoreProvider initialLocale={lang}>
      {/* Organization JSON-LD — 모든 lang 페이지에 공통 노출 (검색엔진 brand entity 등록용) */}
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
      />
      {/* GA4 — Vercel env NEXT_PUBLIC_GA_MEASUREMENT_ID 미설정 시 no-op */}
      <GoogleAnalytics measurementId={env.gaMeasurementId} />
      <SessionBootstrap />
      <div className="fo-shell">
        <div className="fo-frame">
          <FOHeader />
          {/* main 안에 footer 를 두면 .fo-main 의 padding-bottom (FOTabBar 높이) 안에서
              footer 가 scroll 흐름 끝에 자연스럽게 노출 — FOTabBar 가 footer 를 덮지 않음. */}
          <main className="fo-main">
            {children}
            <FOFooter />
          </main>
        </div>
      </div>
      {/* 하단 탭바 — fixed 로 항상 플로팅 */}
      <FOTabBar />
      <Toast />
    </LocaleStoreProvider>
  );
}

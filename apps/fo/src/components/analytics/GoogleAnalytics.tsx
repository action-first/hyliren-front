'use client';

import Script from 'next/script';
import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect, Suspense } from 'react';
import { useLocaleStore } from '@/store/locale';

declare global {
  interface Window {
    gtag?: (command: string, ...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

/**
 * GA4 통합 — gtag init + Next App Router page view 추적.
 *
 * 정책:
 *   - `send_page_view: false` 로 자동 page view 끄고 router 변화 마다 useEffect 에서
 *     명시 호출. Next 의 SPA navigation 을 정확히 잡기 위함 (자동은 초기 로드 1번만).
 *   - locale dimension 첨부 — GA Custom Dimension `lang` 등록 시 다국어 트래픽 분리 분석.
 *   - measurementId 미설정 시 (env 비어있음) 아예 script 미주입 — preview/dev 환경 noise X.
 *
 * 환경변수:
 *   Vercel project Settings → Environment Variables (Production):
 *     NEXT_PUBLIC_GA_MEASUREMENT_ID = G-XXXXXXXXXX
 *   GA4 admin → 데이터 스트림 → 측정 ID 복사.
 */
function PageViewTracker({ measurementId }: { measurementId: string }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const locale = useLocaleStore(s => s.locale);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.gtag) return;
    const qs = searchParams?.toString();
    const url = pathname + (qs ? `?${qs}` : '');
    window.gtag('event', 'page_view', {
      page_path: url,
      page_location: window.location.href,
      page_title: document.title,
      // GA Custom Dimension 'lang' 매핑 시 다국어 분석 가능. 미매핑이어도 event_params 로 누적.
      lang: locale,
    });
  }, [pathname, searchParams, locale, measurementId]);

  return null;
}

export function GoogleAnalytics({ measurementId }: { measurementId: string | undefined }) {
  if (!measurementId) {
    // env 미설정 시 아예 노출 X. preview / dev noise 차단.
    return null;
  }

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`}
        strategy="afterInteractive"
      />
      <Script id="ga-init" strategy="afterInteractive">{`
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        window.gtag = gtag;
        gtag('js', new Date());
        gtag('config', '${measurementId}', { send_page_view: false });
      `}</Script>
      {/* useSearchParams 가 server prerender 시 throw 하지 않도록 Suspense 경계 */}
      <Suspense fallback={null}>
        <PageViewTracker measurementId={measurementId} />
      </Suspense>
    </>
  );
}

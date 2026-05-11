import { env } from '@/lib/env';
import type { ArticleDetailWire, ArticleListWire } from './types';

/**
 * Server-side article fetchers — Next 15 server component + sitemap 에서 사용.
 *
 * 사유: 기존 `lib/api/client.ts` 의 request() 는 brower 의 document.cookie 및
 *      tokenStore (localStorage) 의존이라 SSR / generateMetadata / sitemap loader
 *      에서 호출 불가. article 은 인증 불필요 public API 이므로 Accept-Language
 *      헤더만 동봉하면 server 에서 직접 fetch 가능.
 *
 * 호출 위치: 이 파일은 server runtime 전용 path (server component / sitemap) 에서만
 *           import 되어야 함. client 컴포넌트에서 import 시 번들 부풀음 + env 누출
 *           위험 (현재는 NEXT_PUBLIC_* 만 사용해서 누출은 없지만 컨벤션상 분리).
 *
 * Cache: Next 의 fetch 자동 캐시 (`next.revalidate`) 로 ISR 한 번에 통합.
 *        article 본문은 자주 안 바뀌므로 1시간(3600s) 캐싱. BO에서 수정해도 1시간
 *        내 자동 무효화. 즉시 반영이 필요하면 `revalidateTag()` 또는
 *        Vercel deploy 시 자동 무효화.
 */

const REVALIDATE_SECONDS = 3600; // 1h

function isApiEnvelope<T>(json: unknown): json is { success: boolean; data: T } {
  return typeof json === 'object' && json !== null && 'success' in json;
}

async function envelopeFetch<T>(url: string, locale?: string): Promise<T> {
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (locale) headers['Accept-Language'] = locale;
  const res = await fetch(url, {
    headers,
    next: { revalidate: REVALIDATE_SECONDS },
  });
  if (!res.ok) throw new Error(`Article server fetch failed: ${res.status} ${url}`);
  const json: unknown = await res.json();
  if (!isApiEnvelope<T>(json) || !json.success) {
    throw new Error(`Article server fetch envelope error: ${url}`);
  }
  return json.data;
}

/** Article 상세 — slug + locale 별 본문. 미존재 시 throw. caller가 notFound() 처리. */
export async function fetchArticleServer(slug: string, locale: string): Promise<ArticleDetailWire> {
  const url = `${env.customerApiBaseUrl}/api/v1/articles/${encodeURIComponent(slug)}`;
  return envelopeFetch<ArticleDetailWire>(url, locale);
}

/** Sitemap 용 — published article slugs 일괄 조회 (limit 200, 향후 페이지네이션 필요 시 확장). */
export async function fetchAllArticleSlugsServer(): Promise<string[]> {
  const url = `${env.customerApiBaseUrl}/api/v1/articles?limit=200`;
  try {
    const list = await envelopeFetch<ArticleListWire>(url);
    return list.articles.map((a) => a.slug);
  } catch (e) {
    // sitemap build 시점에 BE 가 응답 못 해도 정적 path 만으로 sitemap 생성되도록 graceful fail
    console.error('[sitemap] article slug fetch failed:', e);
    return [];
  }
}

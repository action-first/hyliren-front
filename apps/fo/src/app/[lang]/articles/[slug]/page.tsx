import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { isLocale, LOCALES } from '@hyliren/shared';
import { env } from '@/lib/env';
import { fetchArticleServer } from '@/lib/api/article/server';
import { mapArticleDetail, type ArticleDetail } from '@/lib/api/article';
import { ArticleDetailClient } from './ArticleDetailClient';

/**
 * Article 상세 — server component.
 *
 * SEO 목적:
 *   - 본문 HTML 을 SSR 단계에서 직접 출력 → 검색엔진이 본문 인덱싱 가능
 *   - generateMetadata 가 article별 title / description / canonical / hreflang / OG meta 주입
 *   - JSON-LD `Article` schema 로 Google rich result 자격 확보
 *
 * ISR: `revalidate = 3600` (1h). BO 에서 article 수정 시 ~1시간 내 자동 반영.
 *      즉시 반영이 필요하면 향후 BO 가 `revalidateTag('article')` 호출하도록 확장.
 *
 * 인터랙션 UI (locale store 구독·Link 등) 는 `ArticleDetailClient` 가 담당.
 */

export const revalidate = 3600; // 1h ISR (Next 는 segment config 에 literal number만 허용)

interface PageProps {
  params: Promise<{ lang: string; slug: string }>;
}

async function loadArticle(lang: string, slug: string): Promise<ArticleDetail | null> {
  if (!isLocale(lang)) return null;
  try {
    const wire = await fetchArticleServer(slug, lang);
    return mapArticleDetail(wire);
  } catch {
    return null;
  }
}

function buildAlternates(slug: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const l of LOCALES) {
    out[l] = `${env.siteUrl}/${l}/articles/${slug}`;
  }
  // x-default — Customer 앱 주력 (zh-CN) 으로 매칭. layout 의 정책과 정합.
  out['x-default'] = `${env.siteUrl}/zh-CN/articles/${slug}`;
  return out;
}

/** SEO description fallback — excerpt 없으면 body 첫 160자 (markdown 기호 제거). */
function deriveDescription(article: ArticleDetail): string {
  if (article.excerpt && article.excerpt.trim()) return article.excerpt.trim();
  const plain = article.body
    .replace(/\[IMAGE:[^\]]*\]/gi, '')
    .replace(/[#*_`>|\-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return plain.slice(0, 160);
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { lang, slug } = await params;
  const article = await loadArticle(lang, slug);
  if (!article) {
    // article 미존재 시에도 canonical 빈 metadata 반환 → 404 페이지가 noindex 처리
    return { robots: { index: false, follow: false } };
  }

  const canonical = `${env.siteUrl}/${lang}/articles/${slug}`;
  const description = deriveDescription(article);
  const heroImg = article.images.find((img) => img.type === 'hero');
  const ogImage = article.coverImageUrl ?? heroImg?.url ?? undefined;

  return {
    metadataBase: new URL(env.siteUrl),
    title: article.title,
    description,
    alternates: {
      canonical,
      languages: buildAlternates(slug),
    },
    openGraph: {
      type: 'article',
      title: article.title,
      description,
      url: canonical,
      siteName: 'MIMYO',
      locale: lang,
      publishedTime: article.publishedAt ?? undefined,
      modifiedTime: article.updatedAt,
      images: ogImage ? [{ url: ogImage, alt: article.title }] : undefined,
      tags: article.tags,
    },
    twitter: {
      card: 'summary_large_image',
      title: article.title,
      description,
      images: ogImage ? [ogImage] : undefined,
    },
  };
}

export default async function ArticleDetailPage({ params }: PageProps) {
  const { lang, slug } = await params;
  const article = await loadArticle(lang, slug);
  if (!article) notFound();

  const heroImg = article.images.find((img) => img.type === 'hero');
  const heroUrl = article.coverImageUrl ?? heroImg?.url ?? undefined;

  // schema.org Article — Google rich result 자격 확보 (의료·뷰티 도메인은 NewsArticle 보다
  // Article + about/keywords 조합이 더 적합. medical disclaimer 는 hasPart 가 아니라 본문 내).
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title,
    description: article.excerpt ?? undefined,
    image: heroUrl ? [heroUrl] : undefined,
    datePublished: article.publishedAt ?? undefined,
    dateModified: article.updatedAt,
    inLanguage: lang,
    keywords: article.tags && article.tags.length ? article.tags.join(', ') : undefined,
    author: { '@type': 'Organization', name: 'MIMYO', url: env.siteUrl },
    publisher: {
      '@type': 'Organization',
      name: 'MIMYO',
      logo: { '@type': 'ImageObject', url: `${env.siteUrl}/icon.svg` },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${env.siteUrl}/${lang}/articles/${slug}`,
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ArticleDetailClient article={article} />
    </>
  );
}

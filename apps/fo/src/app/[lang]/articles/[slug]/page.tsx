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

/**
 * SEO description — body 첫 160자에서 derive (markdown 기호 제거).
 *
 * 왜 excerpt 안 쓰는가:
 *   BE 의 article 응답에서 `excerpt` 가 article.locale 과 일치하는 lang 으로 채워졌음을
 *   보장하지 않는다. article_translations 의 lang 별 excerpt 컬럼이 비면 BE 가 sourceLocale
 *   (ko) 의 excerpt 로 fallback → 결과적으로 zh-CN/ja/en 페이지의 meta description 이
 *   한국어로 출력되는 결함이 발생했음. body 는 lang 별 picked single shape 이 일관되게
 *   동작하므로 body 첫 N자에서 derive 하는 게 안전.
 *
 *   향후 BO 가 lang 별 excerpt 마이크로카피를 명시 입력하는 단계가 되면 다시 article.excerpt
 *   우선 사용 가능 (단 article.locale === article.sourceLocale 일 때만 신뢰).
 */
function deriveDescription(article: ArticleDetail): string {
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
  // JSON-LD 의 image 필드는 schema.org 규격상 절대 URL 요구. BE 가 상대 path 로 응답하면
  // metadataBase 가 자동 변환해 주는 OG image 와 달리 JSON-LD 는 raw JSON 이라 변환되지
  // 않는다. siteUrl prefix 를 직접 부여해 Google rich result 자격 확보.
  const heroAbsoluteUrl = heroUrl
    ? (heroUrl.startsWith('http') ? heroUrl : `${env.siteUrl}${heroUrl.startsWith('/') ? '' : '/'}${heroUrl}`)
    : undefined;

  // description 은 generateMetadata 와 동일 로직 (body 첫 160자 derive) — article.excerpt 가
  // sourceLocale (ko) 로 fallback 되어 lang 불일치를 초래하던 결함 회피.
  const jsonLdDescription = deriveDescription(article);

  // schema.org Article — Google rich result 자격 확보 (의료·뷰티 도메인은 NewsArticle 보다
  // Article + about/keywords 조합이 더 적합. medical disclaimer 는 hasPart 가 아니라 본문 내).
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title,
    description: jsonLdDescription,
    image: heroAbsoluteUrl ? [heroAbsoluteUrl] : undefined,
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

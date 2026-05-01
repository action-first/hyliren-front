import type { ArticleListItemWire, ArticleDetailWire, ArticleImageWire } from './types';

/**
 * FE 도메인 모델 — 컴포넌트가 사용. wire shape 의 BE 의존을 mapper 에 격리.
 *
 * tagColor / readTime: FE 자동 계산 (BE 컬럼 없음).
 * - readTime: body 글자수 / 평균 읽기 속도 (한국어 기준 분당 ~500자)
 * - tagColor: category 매핑 (정적 articles-data 의 tagColor 컨벤션)
 */
export interface ArticleListItem {
  id: string;
  slug: string;
  category: string;
  title: string;
  excerpt: string | null;
  coverImageUrl: string | null;
  tags: string[];
  /** BodyArea enum key 목록. 빈 배열은 "전체". */
  bodyAreas: string[];
  /** 표시용 primaryArea (UI 가 첫 항목 또는 'all'). */
  primaryArea: string;
  viewCount: number;
  publishedAt: string | null;
  /** category 매핑. 'info' | 'default' | 'danger' | 'warning'. */
  tagColor: 'info' | 'default' | 'danger' | 'warning';
}

export interface ArticleImage {
  id: string;
  url: string;
  sortOrder: number;
  type: 'hero' | 'procedure' | 'lifestyle';
}

export interface ArticleDetail extends Omit<ArticleListItem, 'tagColor'> {
  intent: string;
  locale: string;
  sourceLocale: string;
  body: string;
  /** body 글자수 / 500 (한국어 기준 1분 ≈ 500자), 최소 1분. */
  readTime: number;
  tagColor: ArticleListItem['tagColor'];
  images: ArticleImage[];
  createdAt: string;
  updatedAt: string;
}

const CATEGORY_TAG_COLOR: Record<string, ArticleListItem['tagColor']> = {
  guide: 'default',
  review: 'info',
  news: 'default',
  tip: 'warning',
};

function categoryToTagColor(category: string): ArticleListItem['tagColor'] {
  return CATEGORY_TAG_COLOR[category] ?? 'default';
}

function deriveReadTime(body: string): number {
  return Math.max(1, Math.round(body.length / 500));
}

function pickPrimaryArea(bodyAreas: string[]): string {
  return bodyAreas[0] ?? 'all';
}

export function mapArticleListItem(wire: ArticleListItemWire): ArticleListItem {
  return {
    id: wire.id,
    slug: wire.slug,
    category: wire.category,
    title: wire.title,
    excerpt: wire.excerpt,
    coverImageUrl: wire.coverImageUrl,
    tags: wire.tags,
    bodyAreas: wire.bodyAreas,
    primaryArea: pickPrimaryArea(wire.bodyAreas),
    viewCount: wire.viewCount,
    publishedAt: wire.publishedAt,
    tagColor: categoryToTagColor(wire.category),
  };
}

export function mapArticleImage(wire: ArticleImageWire): ArticleImage {
  return {
    id: wire.id,
    url: wire.imageUrl,
    sortOrder: wire.sortOrder,
    // BE 응답에 type 미포함 시 sort_order 기준 fallback (0=hero, 1=procedure, 2+=lifestyle).
    type: wire.type ?? (wire.sortOrder === 0 ? 'hero' : wire.sortOrder === 1 ? 'procedure' : 'lifestyle'),
  };
}

export function mapArticleDetail(wire: ArticleDetailWire): ArticleDetail {
  return {
    id: wire.id,
    slug: wire.slug,
    category: wire.category,
    intent: wire.intent,
    locale: wire.locale,
    sourceLocale: wire.sourceLocale,
    title: wire.title,
    body: wire.body,
    excerpt: wire.excerpt,
    coverImageUrl: wire.coverImageUrl,
    tags: wire.tags,
    bodyAreas: wire.bodyAreas,
    primaryArea: pickPrimaryArea(wire.bodyAreas),
    viewCount: wire.viewCount,
    publishedAt: wire.publishedAt,
    createdAt: wire.createdAt,
    updatedAt: wire.updatedAt,
    readTime: deriveReadTime(wire.body),
    tagColor: categoryToTagColor(wire.category),
    images: wire.images.map(mapArticleImage),
  };
}

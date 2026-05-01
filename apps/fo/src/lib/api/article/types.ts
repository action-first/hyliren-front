/**
 * BE 응답 wire shape — `apps/customer/src/article/dtos/response/*.dto.ts` 와 1:1 매핑.
 *
 * picked single shape (PR #44 정렬): BE 가 Accept-Language 로 받은 viewerLocale 의
 * translations 행을 pickField 로 골라 single value (title/body/excerpt) 로 반환.
 * locale/sourceLocale 메타로 FE 가 "원문 보기"·"번역 준비 중" 표기 가능.
 */

export interface ArticleListItemWire {
  id: string;
  slug: string;
  category: string;
  title: string;
  excerpt: string | null;
  coverImageUrl: string | null;
  tags: string[];
  bodyAreas: string[];
  viewCount: number;
  publishedAt: string | null;
}

export interface ArticleListWire {
  articles: ArticleListItemWire[];
  total: number;
  page: number;
  limit: number;
}

export interface ArticleImageWire {
  id: string;
  imageUrl: string;
  sortOrder: number;
  /** 'hero' | 'procedure' | 'lifestyle' — BE 가 article_images.type 응답 추가 시점부터 채워짐. */
  type?: 'hero' | 'procedure' | 'lifestyle';
}

export interface ArticleDetailWire {
  id: string;
  slug: string;
  category: string;
  intent: string;
  /** 응답 본문 locale (요청 + fallback chain 결과). */
  locale: string;
  /** 원본 작성 locale. */
  sourceLocale: string;
  title: string;
  body: string;
  excerpt: string | null;
  coverImageUrl: string | null;
  tags: string[];
  bodyAreas: string[];
  viewCount: number;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  images: ArticleImageWire[];
}

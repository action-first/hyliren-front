/**
 * Admin Articles API client — direct backend 호출 (BFF 미경유).
 * 컨벤션은 admin-buyers.ts / admin-proposals.ts 와 동일.
 *
 * BE: hyliren-api/apps/admin/src/article
 *   - GET    /admin/articles
 *   - GET    /admin/articles/:id
 *   - POST   /admin/articles
 *   - PATCH  /admin/articles/:id
 *   - PATCH  /admin/articles/:id/status
 *   - DELETE /admin/articles/:id
 */
import { request } from './client';

export type ArticleStatus = 'draft' | 'published' | 'archived';
export type ArticleCategory = 'guide' | 'review' | 'news' | 'tip';
export type ArticleIntent = 'education' | 'promotion' | 'seo';
export type ArticleLocale = 'ko' | 'zh-CN' | 'ja' | 'en';

export interface AdminArticleTranslation {
  locale: ArticleLocale;
  title: string;
  body: string;
  excerpt: string;
}

export interface AdminArticleListItem {
  id: string;
  slug: string;
  status: ArticleStatus;
  category: ArticleCategory;
  featured: boolean;
  title: string;
  sourceLocale: ArticleLocale;
  viewCount: number;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AdminArticleListResponse {
  articles: AdminArticleListItem[];
  total: number;
  page: number;
  limit: number;
}

export interface AdminArticleDetail {
  id: string;
  slug: string;
  status: ArticleStatus;
  category: ArticleCategory;
  intent: ArticleIntent;
  coverImageUrl: string | null;
  tags: string[];
  bodyAreas: string[];
  featured: boolean;
  sourceLocale: ArticleLocale;
  viewCount: number;
  ctaClickCount: number;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  translations: AdminArticleTranslation[];
}

export interface AdminArticleListQuery {
  status?: ArticleStatus;
  category?: ArticleCategory;
  featured?: boolean;
  keyword?: string;
  page?: number;
  limit?: number;
}

export interface CreateArticleBody {
  slug?: string;
  status: ArticleStatus;
  category: ArticleCategory;
  intent: ArticleIntent;
  coverImageUrl?: string | null;
  tags: string[];
  bodyAreas: string[];
  featured: boolean;
  sourceLocale: ArticleLocale;
  translations: AdminArticleTranslation[];
}

export type UpdateArticleBody = Partial<Omit<CreateArticleBody, 'status'>>;

const BASE = '/articles';

export function listArticles(query?: AdminArticleListQuery): Promise<AdminArticleListResponse> {
  const params = new URLSearchParams();
  if (query?.status) params.set('status', query.status);
  if (query?.category) params.set('category', query.category);
  if (typeof query?.featured === 'boolean') params.set('featured', String(query.featured));
  if (query?.keyword) params.set('keyword', query.keyword);
  if (query?.page != null) params.set('page', String(query.page));
  if (query?.limit != null) params.set('limit', String(query.limit));
  const qs = params.toString();
  return request<AdminArticleListResponse>(qs ? `${BASE}?${qs}` : BASE, { method: 'GET' });
}

export function getArticle(id: string): Promise<AdminArticleDetail> {
  return request<AdminArticleDetail>(`${BASE}/${encodeURIComponent(id)}`, { method: 'GET' });
}

export function createArticle(body: CreateArticleBody): Promise<AdminArticleDetail> {
  return request<AdminArticleDetail>(BASE, { method: 'POST', body });
}

export function updateArticle(id: string, body: UpdateArticleBody): Promise<AdminArticleDetail> {
  return request<AdminArticleDetail>(`${BASE}/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body,
  });
}

export function updateArticleStatus(id: string, status: ArticleStatus): Promise<AdminArticleDetail> {
  return request<AdminArticleDetail>(`${BASE}/${encodeURIComponent(id)}/status`, {
    method: 'PATCH',
    body: { status },
  });
}

export function deleteArticle(id: string): Promise<void> {
  return request<void>(`${BASE}/${encodeURIComponent(id)}`, { method: 'DELETE' });
}

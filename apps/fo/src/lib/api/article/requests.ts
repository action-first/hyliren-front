import { request } from '@/lib/api/client';

import type { ArticleListWire, ArticleDetailWire } from './types';

const BASE = '/api/v1/articles';

export interface ListArticlesParams {
  /** 'guide' | 'review' | 'news' | 'tip' (BE article_category enum). */
  category?: string;
  page?: number;
  limit?: number;
}

export async function listArticles(params?: ListArticlesParams): Promise<ArticleListWire> {
  const qs = new URLSearchParams();
  if (params?.category) qs.set('category', params.category);
  if (params?.page != null) qs.set('page', String(params.page));
  if (params?.limit != null) qs.set('limit', String(params.limit));
  const query = qs.toString();
  return request<ArticleListWire>(`${BASE}${query ? `?${query}` : ''}`, { auth: false });
}

export async function listFeaturedArticles(limit?: number): Promise<ArticleListWire> {
  const qs = limit != null ? `?limit=${limit}` : '';
  return request<ArticleListWire>(`${BASE}/featured${qs}`, { auth: false });
}

export interface RelatedArticlesParams {
  concernId?: string;
  /** BodyArea enum key (eyes/nose/lifting/skin/diet/etc). */
  area?: string;
}

export async function listRelatedArticles(params?: RelatedArticlesParams): Promise<ArticleListWire> {
  const qs = new URLSearchParams();
  if (params?.concernId) qs.set('concernId', params.concernId);
  if (params?.area) qs.set('area', params.area);
  const query = qs.toString();
  return request<ArticleListWire>(`${BASE}/related${query ? `?${query}` : ''}`, { auth: false });
}

export async function getArticle(slug: string): Promise<ArticleDetailWire> {
  return request<ArticleDetailWire>(`${BASE}/${encodeURIComponent(slug)}`, { auth: false });
}

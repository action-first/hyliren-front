'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Badge, Button, Spinner } from '@hyliren/ui';
import { Clock, Eye, ChevronRight } from 'lucide-react';
import { useLocaleStore } from '@/store/locale';
import {
  listArticles,
  listFeaturedArticles,
  mapArticleListItem,
  type ArticleListItem,
} from '@/lib/api/article';
import { AREA_BAR } from '@/lib/area-styles';

/**
 * Article 카테고리 필터 옵션 — BE article_category enum (guide/review/news/tip) 기반.
 * 'all' 은 UI-only sentinel — BE 호출 시 category 파라미터 미첨부.
 */
const CATEGORY_FILTERS: { value: 'all' | 'review' | 'guide' | 'tip'; labelKey: string }[] = [
  { value: 'all', labelKey: 'articles2.categoryAll' },
  { value: 'review', labelKey: 'articles2.categoryComparison' },
  { value: 'guide', labelKey: 'articles2.categoryGuide' },
  { value: 'tip', labelKey: 'articles2.categorySafety' },
];

const AREA_COLORS = AREA_BAR;

/**
 * 조회수 압축 표기 — 로케일별 자연스러운 단위 적용 (Intl.NumberFormat compact).
 * - ko: 1.5만 / zh-CN: 1.5万 / ja: 1.5万 / en: 15K
 */
function formatViews(n: number, locale: string): string {
  return new Intl.NumberFormat(locale, { notation: 'compact', maximumFractionDigits: 1 }).format(n);
}

export default function ArticlesPage() {
  const t = useLocaleStore(s => s.t);
  const locale = useLocaleStore(s => s.locale);
  const [selectedCategory, setSelectedCategory] = useState<typeof CATEGORY_FILTERS[number]['value']>('all');
  const [articles, setArticles] = useState<ArticleListItem[]>([]);
  const [featured, setFeatured] = useState<ArticleListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  /* ── BE 연동 ──
   * - list: 카테고리 필터 별로 재호출 (selectedCategory 변경 시)
   * - featured: 별도 endpoint, 한 번만 호출
   * - locale 변경 시 list/featured 모두 재호출 (Accept-Language 자동 주입 → 다국어 응답)
   */
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(false);
    const params = selectedCategory === 'all' ? undefined : { category: selectedCategory };
    listArticles(params)
      .then(wire => {
        if (cancelled) return;
        setArticles(wire.articles.map(mapArticleListItem));
        setLoading(false);
      })
      .catch(() => { if (!cancelled) { setError(true); setLoading(false); } });
    return () => { cancelled = true; };
  }, [selectedCategory, locale]);

  useEffect(() => {
    let cancelled = false;
    listFeaturedArticles(5)
      .then(wire => {
        if (cancelled) return;
        // BE featured endpoint 가 viewCount 정렬 — featured 컬럼 직접 노출 안 됨.
        // articles.featured=true 로 큐레이션된 항목만 보여주려면 BE 가 별도 필드 노출 필요.
        // 현재는 BE 반환 그대로 사용 (조회수 상위 N).
        setFeatured(wire.articles.map(mapArticleListItem));
      })
      .catch(() => { /* silent — featured 영역만 비어도 list 는 정상 */ });
    return () => { cancelled = true; };
  }, [locale]);

  return (
    <div className="flex flex-col pb-10">
      {/* Header */}
      <div className="px-5 pt-6 pb-4">
        <h1 className="text-[1.375rem] font-bold text-[var(--color-text)] leading-tight mb-1">
          {t('articles.pageTitle')}
        </h1>
        <p className="text-[13px] text-[var(--color-text-dim)]">
          {t('articles.pageDesc')}
        </p>
      </div>

      {/* Featured */}
      {featured.length > 0 && (
        <section className="px-5 mb-6">
          <div className="flex gap-3 overflow-x-auto pb-1 -mr-5 pr-5" style={{ scrollbarWidth: 'none' }}>
            {featured.map(a => (
              <Link key={a.id} href={`/articles/${a.slug}`}
                className="min-w-[15rem] max-w-[16rem] shrink-0 rounded-[var(--app-radius-md)] overflow-hidden bg-[var(--color-bg)] no-underline"
                style={{ boxShadow: 'var(--app-shadow-card-light)' }}>
                <div className="h-24 overflow-hidden relative">
                  {a.coverImageUrl && (
                    <img src={a.coverImageUrl} alt={a.title} className="w-full h-full object-cover" />
                  )}
                  <div className={`absolute bottom-0 left-0 right-0 h-1 ${AREA_COLORS[a.primaryArea] || 'bg-[var(--color-border)]'}`} />
                </div>
                <div className="px-3.5 py-3">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <Badge variant={a.tagColor} size="sm">
                      {t(CATEGORY_FILTERS.find(c => c.value === a.category)?.labelKey ?? 'articles2.categoryAll')}
                    </Badge>
                  </div>
                  <p className="text-[13px] font-semibold text-[var(--color-text)] leading-snug line-clamp-2 mb-1.5">{a.title}</p>
                  <div className="flex items-center gap-3 text-[10px] text-[var(--color-text-dim)]">
                    <span className="flex items-center gap-0.5"><Eye size={9} /> {formatViews(a.viewCount, locale)}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Category filter */}
      <div className="px-5 mb-4">
        <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
          {CATEGORY_FILTERS.map(cat => (
            <button key={cat.value} type="button"
              onClick={() => setSelectedCategory(cat.value)}
              className={`shrink-0 px-3.5 py-2 rounded-full text-[12px] font-medium border-0 cursor-pointer transition-colors ${
                selectedCategory === cat.value
                  ? 'bg-[var(--color-text)] text-white'
                  : 'bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)]'
              }`}>
              {t(cat.labelKey)}
            </button>
          ))}
        </div>
      </div>

      {/* Article list */}
      {loading ? (
        <div className="flex items-center justify-center py-12"><Spinner /></div>
      ) : error ? (
        <p className="text-center text-[13px] text-[var(--color-text-dim)] py-12">{t('articles.loadError')}</p>
      ) : articles.length === 0 ? (
        <p className="text-center text-[13px] text-[var(--color-text-dim)] py-12">{t('articles.empty')}</p>
      ) : (
        <div className="flex flex-col gap-2.5 px-5">
          {articles.map(a => (
            <Link key={a.id} href={`/articles/${a.slug}`}
              className="flex gap-3 p-3 rounded-[var(--app-radius)] bg-[var(--color-bg)] no-underline"
              style={{ boxShadow: 'var(--app-shadow-card-sm)' }}>
              <div className="w-16 h-16 rounded-[var(--app-radius-sm)] overflow-hidden shrink-0 relative">
                {a.coverImageUrl && (
                  <img src={a.coverImageUrl} alt={a.title} className="w-full h-full object-cover" />
                )}
                <div className={`absolute bottom-0 left-0 right-0 h-1 ${AREA_COLORS[a.primaryArea] || 'bg-[var(--color-border)]'}`} />
              </div>
              <div className="flex flex-col gap-1 justify-center min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <Badge variant={a.tagColor} size="sm">
                    {t(CATEGORY_FILTERS.find(c => c.value === a.category)?.labelKey ?? 'articles2.categoryAll')}
                  </Badge>
                  {a.primaryArea !== 'all' && (
                    <span className="text-[10px] text-[var(--color-text-dim)]">
                      {t(`common.bodyArea.${a.primaryArea}`)}
                    </span>
                  )}
                </div>
                <span className="text-[13px] font-medium text-[var(--color-text)] leading-snug line-clamp-2">{a.title}</span>
                <div className="flex items-center gap-3 text-[10px] text-[var(--color-text-dim)]">
                  <span className="flex items-center gap-0.5"><Eye size={9} /> {formatViews(a.viewCount, locale)}</span>
                </div>
              </div>
              <ChevronRight size={14} className="text-[var(--color-text-dim)] shrink-0 self-center" />
            </Link>
          ))}
        </div>
      )}

      {/* Bottom CTA */}
      <div className="px-5 mt-6">
        <div className="flex items-center gap-3 px-4 py-3.5 rounded-[var(--app-radius-md)] fo-gradient-accent">
          <div className="flex-1">
            <span className="text-[13px] font-semibold text-[var(--color-text)] block">{t('articles.bottomTitle')}</span>
            <span className="text-[11px] text-[var(--color-text-dim)]">{t('articles.bottomDesc')}</span>
          </div>
          <Link href="/consult" className="no-underline">
            <Button variant="primary" size="sm">{t('articles.bottomCta')}</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

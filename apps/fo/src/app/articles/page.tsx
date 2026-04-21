'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Badge, Button } from '@hyliren/ui';
import { Clock, Eye, ChevronRight, ArrowRight } from 'lucide-react';
import { useLocaleStore } from '@/store/locale';
import { ARTICLES } from '@/lib/articles-data';
import type { Article } from '@/lib/articles-data';

const CATEGORIES_KO = ['전체', '시술 비교', '시술 가이드', '안전 정보'];

import { AREA_BAR } from '@/lib/area-styles';
const AREA_COLORS = AREA_BAR;

function formatViews(n: number): string {
  return n >= 10000 ? `${(n / 10000).toFixed(1)}만` : n >= 1000 ? `${(n / 1000).toFixed(1)}천` : String(n);
}

export default function ArticlesPage() {
  const t = useLocaleStore(s => s.t);
  const [selectedCategory, setSelectedCategory] = useState('전체');
  const filtered = selectedCategory === '전체'
    ? ARTICLES
    : ARTICLES.filter(a => a.category === selectedCategory);

  const featured = ARTICLES.filter(a => a.featured);

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
      <section className="px-5 mb-6">
        <div className="flex gap-3 overflow-x-auto pb-1 -mr-5 pr-5" style={{ scrollbarWidth: 'none' }}>
          {featured.map(a => (
            <Link key={a.id} href={`/articles/${a.slug}`}
              className="min-w-[15rem] max-w-[16rem] shrink-0 rounded-2xl overflow-hidden bg-white no-underline"
              style={{ boxShadow: 'var(--app-shadow-card-light)' }}>
              <div className="h-24 overflow-hidden relative">
                <img src={a.heroImage} alt={a.title} className="w-full h-full object-cover" />
                <div className={`absolute bottom-0 left-0 right-0 h-1 ${AREA_COLORS[a.bodyArea] || 'bg-gray-300'}`} />
              </div>
              <div className="px-3.5 py-3">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <Badge variant={a.tagColor} size="sm">{a.category}</Badge>
                </div>
                <p className="text-[13px] font-semibold text-[var(--color-text)] leading-snug line-clamp-2 mb-1.5">{a.title}</p>
                <div className="flex items-center gap-3 text-[10px] text-[var(--color-text-dim)]">
                  <span className="flex items-center gap-0.5"><Clock size={9} /> {a.readTime}분</span>
                  <span className="flex items-center gap-0.5"><Eye size={9} /> {formatViews(a.views)}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Category filter */}
      <div className="px-5 mb-4">
        <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
          {CATEGORIES_KO.map(cat => (
            <button key={cat} type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`shrink-0 px-3.5 py-2 rounded-full text-[12px] font-medium border-0 cursor-pointer transition-colors ${
                selectedCategory === cat
                  ? 'bg-[var(--color-text)] text-white'
                  : 'bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)]'
              }`}>
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Article list */}
      <div className="flex flex-col gap-2.5 px-5">
        {filtered.map(a => (
          <Link key={a.id} href={`/articles/${a.slug}`}
            className="flex gap-3 p-3 rounded-xl bg-white no-underline"
            style={{ boxShadow: 'var(--app-shadow-card-sm)' }}>
            <div className="w-16 h-16 rounded-lg overflow-hidden shrink-0 relative">
              <img src={a.heroImage} alt={a.title} className="w-full h-full object-cover" />
              <div className={`absolute bottom-0 left-0 right-0 h-1 ${AREA_COLORS[a.bodyArea] || 'bg-gray-300'}`} />
            </div>
            <div className="flex flex-col gap-1 justify-center min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <Badge variant={a.tagColor} size="sm">{a.category}</Badge>
                {a.bodyArea !== '전체' && (
                  <span className="text-[10px] text-[var(--color-text-dim)]">{a.bodyArea}</span>
                )}
              </div>
              <span className="text-[13px] font-medium text-[var(--color-text)] leading-snug line-clamp-2">{a.title}</span>
              <div className="flex items-center gap-3 text-[10px] text-[var(--color-text-dim)]">
                <span className="flex items-center gap-0.5"><Clock size={9} /> {t('articles.readTime', { min: a.readTime })}</span>
                <span className="flex items-center gap-0.5"><Eye size={9} /> {formatViews(a.views)}</span>
              </div>
            </div>
            <ChevronRight size={14} className="text-[var(--color-text-dim)] shrink-0 self-center" />
          </Link>
        ))}
      </div>

      {/* Bottom CTA */}
      <div className="px-5 mt-6">
        <div className="flex items-center gap-3 px-4 py-3.5 rounded-2xl fo-gradient-accent">
          <div className="flex-1">
            <span className="text-[13px] font-semibold text-[var(--color-text)] block">{t('articles.bottomTitle')}</span>
            <span className="text-[11px] text-[var(--color-text-dim)]">{t('articles.bottomDesc')}</span>
          </div>
          <Link href="/consult" className="no-underline">
            <Button variant="accent" size="sm">{t('articles.bottomCta')}</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

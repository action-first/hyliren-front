'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Link } from '@/components/i18n/Link';
import { ArticleView, Button, Spinner } from '@hyliren/ui';
import type { ArticleTagColor } from '@hyliren/ui';
import { ArrowLeft, ArrowRight, Clock, Eye } from 'lucide-react';
import { useLocaleStore } from '@/store/locale';
import { getArticle, mapArticleDetail, type ArticleDetail } from '@/lib/api/article';
import { ARTICLE_QUIZZES } from '@/lib/article-quizzes';

/**
 * 조회수 압축 표기 — 로케일별 자연스러운 단위 (Intl.NumberFormat compact).
 *  ko: 1.5만 / zh-CN: 1.5万 / ja: 1.5万 / en: 15K
 */
function formatViews(n: number, locale: string): string {
  return new Intl.NumberFormat(locale, { notation: 'compact', maximumFractionDigits: 1 }).format(n);
}

const CATEGORY_LABEL_KEY: Record<string, string> = {
  guide: 'articles2.categoryGuide',
  review: 'articles2.categoryComparison',
  news: 'articles2.categoryAll',
  tip: 'articles2.categorySafety',
};

type TFn = (key: string, params?: Record<string, string | number>) => string;

/** quiz UI — body 안 [IMAGE: lifestyle] 위치에 삽입. 한국어 raw 콘텐츠 정합 위해 ko locale 만 노출. */
function QuizSlot({ slug, locale, t }: { slug: string; locale: string; t: TFn }) {
  if (locale !== 'ko') return null;
  const quiz = ARTICLE_QUIZZES[slug];
  if (!quiz) return null;
  return (
    <div className="my-6 rounded-[var(--app-radius-md)] bg-[var(--color-bg-secondary)] p-5">
      <p className="text-[15px] font-bold text-[var(--color-text)] mb-4">{quiz.title}</p>
      <div className="flex flex-col gap-3">
        {quiz.items.map((item, qi) => (
          <div key={qi}>
            <p className="text-[12px] font-medium text-[var(--color-text-secondary)] mb-1.5">{item.question}</p>
            <div className="flex flex-wrap gap-1.5">
              {item.options.map((opt, oi) => (
                <span key={oi} className="px-3 py-1.5 rounded-full bg-[var(--color-bg)] text-[12px] text-[var(--color-text)] border border-[var(--color-border-light)]">
                  {opt}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
      <p className="text-[10.5px] text-[var(--color-text-dim)] mt-4">{t('mypage.articleHelpHint')}</p>
    </div>
  );
}

export default function ArticleDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const t = useLocaleStore(s => s.t);
  const locale = useLocaleStore(s => s.locale);
  const [article, setArticle] = useState<ArticleDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setNotFound(false);
    getArticle(slug)
      .then(wire => {
        if (cancelled) return;
        setArticle(mapArticleDetail(wire));
        setLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setNotFound(true);
        setLoading(false);
      });
    return () => { cancelled = true; };
  }, [slug, locale]);

  if (loading) {
    return <div className="flex items-center justify-center min-h-[60vh]"><Spinner /></div>;
  }

  if (notFound || !article) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-5">
        <p className="text-[15px] font-semibold text-[var(--color-text)] mb-2">{t('mypage.articleNotFound')}</p>
        <Link href="/articles" className="text-[13px] text-[var(--color-primary)] no-underline">
          {t('mypage.backToArticles')}
        </Link>
      </div>
    );
  }

  const heroImg = article.images.find(img => img.type === 'hero');

  return (
    <ArticleView
      title={article.title}
      body={article.body}
      coverImageUrl={article.coverImageUrl ?? heroImg?.url ?? null}
      categoryLabel={t(CATEGORY_LABEL_KEY[article.category] ?? 'articles2.categoryAll')}
      tagColor={article.tagColor as ArticleTagColor}
      primaryAreaLabel={article.primaryArea !== 'all' ? t(`common.bodyArea.${article.primaryArea}`) : undefined}
      readTimeLabel={
        <span className="flex items-center gap-1"><Clock size={11} /> {t('articles.readTime', { min: article.readTime })}</span>
      }
      viewCountLabel={
        <span className="flex items-center gap-1"><Eye size={11} /> {formatViews(article.viewCount, locale)}</span>
      }
      publishedAtLabel={article.publishedAt ? article.publishedAt.slice(0, 10) : undefined}
      topSlot={
        <Link href="/articles" className="flex items-center gap-1 text-[12px] text-[var(--color-text-dim)] no-underline">
          <ArrowLeft size={14} /> {t('articles.backToList')}
        </Link>
      }
      lifestyleSlot={<QuizSlot slug={article.slug} locale={locale} t={t} />}
      mascotVideoUrl="/character/mimyo.mp4"
      bottomSlot={
        <div className="flex items-center gap-3 px-4 py-3.5 rounded-[var(--app-radius-md)] fo-gradient-accent">
          <div className="flex-1">
            <span className="text-[13px] font-semibold text-[var(--color-text)] block">{t('articles.bottomTitle')}</span>
            <span className="text-[11px] text-[var(--color-text-dim)]">{t('articles.bottomDesc')}</span>
          </div>
          <Link href="/consult" className="no-underline">
            <Button variant="primary" size="sm">{t('articles.bottomCta')} <ArrowRight size={12} /></Button>
          </Link>
        </div>
      }
    />
  );
}

'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Badge, Button } from '@hyliren/ui';
import { ArrowLeft, ArrowRight, Clock, Eye } from 'lucide-react';
import { useLocaleStore } from '@/store/locale';
import { getArticleBySlug, getArticleImage } from '@/lib/articles-data';
import type { Article } from '@/lib/articles-data';
import { ARTICLE_QUIZZES } from '@/lib/article-quizzes';

function formatViews(n: number): string {
  return n >= 10000 ? `${(n / 10000).toFixed(1)}만` : n >= 1000 ? `${(n / 1000).toFixed(1)}천` : String(n);
}

/* ── Markdown → JSX (lightweight) ── */
function renderBody(article: Article) {
  const lines = article.body.split('\n');
  const elements: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Image markers
    if (line.trim().startsWith('[IMAGE:')) {
      const type = line.trim().replace('[IMAGE:', '').replace(']', '').trim() as 'hero' | 'procedure' | 'lifestyle';
      // hero는 상단에 이미 표시되므로 본문에서 스킵
      if (type === 'hero') { i++; continue; }
      // lifestyle → 퀴즈 UI로 교체
      if (type === 'lifestyle') {
        const quiz = ARTICLE_QUIZZES[article.slug];
        if (quiz) {
          elements.push(
            <div key={`quiz-${i}`} className="my-6 rounded-2xl bg-[var(--color-bg-secondary)] p-5">
              <p className="text-[15px] font-bold text-[var(--color-text)] mb-4">{quiz.title}</p>
              <div className="flex flex-col gap-3">
                {quiz.items.map((item, qi) => (
                  <div key={qi}>
                    <p className="text-[12px] font-medium text-[var(--color-text-secondary)] mb-1.5">{item.question}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {item.options.map((opt, oi) => (
                        <span key={oi} className="px-3 py-1.5 rounded-full bg-white text-[12px] text-[var(--color-text)] border border-[var(--color-border-light)]">
                          {opt}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-[10.5px] text-[var(--color-text-dim)] mt-4">상담 시 이 정보를 함께 전달하면 더 정확한 방향을 잡을 수 있어요</p>
            </div>,
          );
        }
        i++;
        continue;
      }
      const img = getArticleImage(article, type);
      if (img) {
        elements.push(
          <div key={`img-${i}`} className="my-5 rounded-xl overflow-hidden">
            <img src={img.src} alt={img.alt} className="w-full" loading="lazy" />
          </div>,
        );
      }
      i++;
      continue;
    }

    // Horizontal rule
    if (line.trim() === '---') {
      elements.push(<hr key={`hr-${i}`} className="my-6 border-[var(--color-border-light)]" />);
      i++;
      continue;
    }

    // Headers
    if (line.startsWith('### ')) {
      elements.push(
        <h3 key={`h3-${i}`} className="text-[15px] font-bold text-[var(--color-text)] mt-5 mb-2">
          {renderInline(line.slice(4))}
        </h3>,
      );
      i++;
      continue;
    }
    if (line.startsWith('## ')) {
      elements.push(
        <h2 key={`h2-${i}`} className="text-[1.125rem] font-bold text-[var(--color-text)] mt-6 mb-3">
          {renderInline(line.slice(3))}
        </h2>,
      );
      i++;
      continue;
    }

    // Blockquote
    if (line.startsWith('> ')) {
      const quoteLines: string[] = [];
      while (i < lines.length && lines[i].startsWith('> ')) {
        quoteLines.push(lines[i].slice(2));
        i++;
      }
      elements.push(
        <blockquote key={`bq-${i}`} className="border-l-3 border-[var(--color-primary)] pl-3.5 my-4 text-[13px] text-[var(--color-text-secondary)] italic leading-[1.7]">
          {quoteLines.map((ql, qi) => (
            <p key={qi} className="mb-1 last:mb-0">{renderInline(ql)}</p>
          ))}
        </blockquote>,
      );
      continue;
    }

    // Unordered list
    if (line.startsWith('- ')) {
      const items: string[] = [];
      while (i < lines.length && lines[i].startsWith('- ')) {
        items.push(lines[i].slice(2));
        i++;
      }
      elements.push(
        <ul key={`ul-${i}`} className="my-3 flex flex-col gap-1.5 pl-4">
          {items.map((item, li) => (
            <li key={li} className="text-[13px] text-[var(--color-text-secondary)] leading-[1.7] list-disc">
              {renderInline(item)}
            </li>
          ))}
        </ul>,
      );
      continue;
    }

    // Ordered list
    if (/^\d+\.\s/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\.\s/.test(lines[i])) {
        items.push(lines[i].replace(/^\d+\.\s/, ''));
        i++;
        // Gather continuation lines (indented)
        while (i < lines.length && lines[i].startsWith('   ') && !lines[i].startsWith('   -')) {
          items[items.length - 1] += ' ' + lines[i].trim();
          i++;
        }
      }
      elements.push(
        <ol key={`ol-${i}`} className="my-3 flex flex-col gap-1.5 pl-4">
          {items.map((item, li) => (
            <li key={li} className="text-[13px] text-[var(--color-text-secondary)] leading-[1.7] list-decimal">
              {renderInline(item)}
            </li>
          ))}
        </ol>,
      );
      continue;
    }

    // Empty line
    if (line.trim() === '') {
      i++;
      continue;
    }

    // Paragraph
    elements.push(
      <p key={`p-${i}`} className="text-[13px] text-[var(--color-text-secondary)] leading-[1.8] mb-3">
        {renderInline(line)}
      </p>,
    );
    i++;
  }

  return elements;
}

function renderInline(text: string): React.ReactNode {
  // Bold
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="font-semibold text-[var(--color-text)]">{part.slice(2, -2)}</strong>;
    }
    return part;
  });
}

export default function ArticleDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const t = useLocaleStore(s => s.t);
  const article = getArticleBySlug(slug);

  if (!article) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-5">
        <p className="text-[15px] font-semibold text-[var(--color-text)] mb-2">아티클을 찾을 수 없습니다</p>
        <Link href="/articles" className="text-[13px] text-[var(--color-primary)] no-underline">
          ← 목록으로
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col pb-10">
      {/* Back */}
      <div className="px-5 pt-4 pb-2">
        <Link href="/articles" className="flex items-center gap-1 text-[12px] text-[var(--color-text-dim)] no-underline">
          <ArrowLeft size={14} /> 목록
        </Link>
      </div>

      {/* Hero image */}
      <div className="px-5 mb-4">
        <div className="rounded-2xl overflow-hidden">
          <img src={article.heroImage} alt={article.title} className="w-full aspect-[16/9] object-cover" />
        </div>
      </div>

      {/* Meta */}
      <div className="px-5 mb-4">
        <div className="flex items-center gap-2 mb-2">
          <Badge variant={article.tagColor} size="sm">{article.category}</Badge>
          {article.bodyArea !== '전체' && (
            <span className="text-[10px] text-[var(--color-text-dim)]">{article.bodyArea}</span>
          )}
        </div>
        <h1 className="text-[1.25rem] font-bold text-[var(--color-text)] leading-[1.35] tracking-[-0.3px] mb-2">
          {article.title}
        </h1>
        <div className="flex items-center gap-3 text-[11px] text-[var(--color-text-dim)]">
          <span className="flex items-center gap-1"><Clock size={11} /> {article.readTime}분</span>
          <span className="flex items-center gap-1"><Eye size={11} /> {formatViews(article.views)}</span>
          <span>{article.publishedAt}</span>
        </div>
      </div>

      {/* Body */}
      <div className="px-5">
        {renderBody(article)}
      </div>

      {/* Bottom CTA */}
      <div className="px-5 mt-6">
        <div className="flex items-center gap-3 px-4 py-3.5 rounded-2xl bg-gradient-to-r from-[var(--color-primary-soft)] to-[var(--color-bg-wash)]">
          <div className="flex-1">
            <span className="text-[13px] font-semibold text-[var(--color-text)] block">{t('articles.bottomTitle')}</span>
            <span className="text-[11px] text-[var(--color-text-dim)]">{t('articles.bottomDesc')}</span>
          </div>
          <Link href="/consult" className="no-underline">
            <Button variant="accent" size="sm">{article.ctaText} <ArrowRight size={12} /></Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

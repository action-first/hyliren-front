'use client';

import { useEffect, useState } from 'react';
import { ArticleView } from '@hyliren/ui';
import type { ArticleTagColor } from '@hyliren/ui';
import type { ArticleCategory, ArticleLocale, AdminArticleTranslation } from '@/lib/api/admin-articles';

const LOCALES: ArticleLocale[] = ['ko', 'zh-CN', 'ja', 'en'];

const LOCALE_LABEL: Record<ArticleLocale, string> = {
  ko: '한국어',
  'zh-CN': '中文',
  ja: '日本語',
  en: 'English',
};

const CATEGORY_LABEL_KR: Record<ArticleCategory, string> = {
  guide: '시술 가이드',
  review: '시술 후기',
  news: '뉴스',
  tip: '팁',
};

/** FO mapper.ts 와 동일 매핑 — drift 방지 위해 향후 packages/shared 추출 검토. */
const CATEGORY_TAG_COLOR: Record<ArticleCategory, ArticleTagColor> = {
  guide: 'default',
  review: 'info',
  news: 'default',
  tip: 'warning',
};

interface PreviewModalProps {
  open: boolean;
  onClose: () => void;
  /** 4 lang 입력값. 빈 lang 은 sourceLocale fallback. */
  translations: Record<ArticleLocale, AdminArticleTranslation>;
  sourceLocale: ArticleLocale;
  category: ArticleCategory;
  coverImageUrl: string | null;
  bodyAreas: string[];
}

/**
 * BO 아티클 미리보기 모달 — FO `/articles/{slug}` 와 동일한 ArticleView 컴포넌트로 렌더.
 * 4 lang 탭으로 전환하여 활성 locale 의 translation 미리보기.
 *
 * 미입력 lang 은 sourceLocale 의 translation 으로 fallback (FO 와 동일 정책).
 * 저장 전 form state 기반이므로 viewCount / publishedAt / readTime 미표시.
 */
export function PreviewModal({
  open,
  onClose,
  translations,
  sourceLocale,
  category,
  coverImageUrl,
  bodyAreas,
}: PreviewModalProps) {
  const [activeLocale, setActiveLocale] = useState<ArticleLocale>(sourceLocale);

  useEffect(() => {
    if (open) setActiveLocale(sourceLocale);
  }, [open, sourceLocale]);

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  // fallback — 활성 lang 비어 있으면 sourceLocale 사용
  const active = translations[activeLocale];
  const fallback = translations[sourceLocale];
  const usedTranslation = active.title.trim() || active.body.trim() ? active : fallback;
  const usingFallback = usedTranslation !== active;

  const primaryArea = bodyAreas[0];

  return (
    <div className="fixed inset-0 z-[60] flex items-stretch justify-center bg-black/50">
      <div className="absolute inset-0" onClick={onClose} />

      <div className="relative bg-[var(--color-surface)] w-full max-w-[480px] max-h-[100vh] flex flex-col shadow-xl">
        {/* 헤더 */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-default)] flex-shrink-0">
          <div>
            <h2 className="text-[15px] font-semibold text-[var(--text-default)]">미리보기</h2>
            <p className="text-[11px] text-[var(--text-disabled)] mt-0.5">FO 게시 시 노출 화면 (저장 전 form 기준)</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="닫기"
            className="w-8 h-8 flex items-center justify-center rounded-[var(--app-radius-sm)] hover:bg-[var(--surface-subdued)] text-[var(--text-disabled)] cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* lang 탭 */}
        <div className="flex gap-1 px-4 pt-3 border-b border-[var(--border-default)] flex-shrink-0">
          {LOCALES.map(loc => {
            const isActive = loc === activeLocale;
            const isSource = loc === sourceLocale;
            const filled = !!translations[loc].title || !!translations[loc].body;
            return (
              <button
                key={loc}
                type="button"
                onClick={() => setActiveLocale(loc)}
                className={`
                  px-3 py-2 border-b-2 -mb-px text-[12px] transition-colors flex items-center gap-1.5
                  ${isActive
                    ? 'border-[var(--text-default)] text-[var(--text-default)] font-semibold'
                    : 'border-transparent text-[var(--text-subdued)] hover:text-[var(--text-default)]'}
                `}
              >
                {LOCALE_LABEL[loc]}
                {isSource && (
                  <span className="text-[9px] px-1 py-0.5 rounded bg-[var(--color-warning-soft)] text-[var(--color-warning)]">
                    src
                  </span>
                )}
                {!isSource && filled && (
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-success)]" />
                )}
              </button>
            );
          })}
        </div>

        {/* fallback 안내 */}
        {usingFallback && (
          <div className="px-4 py-2 text-[11px] text-[var(--color-warning)] bg-[var(--color-warning-soft)] flex-shrink-0">
            ⓘ {LOCALE_LABEL[activeLocale]} 번역 미입력 — {LOCALE_LABEL[sourceLocale]} (source) 로 미리보기
          </div>
        )}

        {/* 미리보기 영역 — FO 모바일 프레임 폭과 정합. 탭과 cover 간 호흡 위해 pt-5. */}
        <div className="flex-1 overflow-y-auto bg-[var(--color-bg, #fff)] pt-5">
          <ArticleView
            title={usedTranslation.title || '(제목 미입력)'}
            body={usedTranslation.body || '(본문 미입력)'}
            coverImageUrl={coverImageUrl}
            excerpt={usedTranslation.excerpt}
            categoryLabel={CATEGORY_LABEL_KR[category]}
            tagColor={CATEGORY_TAG_COLOR[category]}
            primaryAreaLabel={primaryArea}
            mascotVideoUrl="https://mi-myo.com/character/mimyo.mp4"
          />
        </div>
      </div>
    </div>
  );
}

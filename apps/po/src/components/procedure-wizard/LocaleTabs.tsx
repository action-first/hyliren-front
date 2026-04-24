'use client';

import type { Locale } from '@hyliren/shared';
import { LOCALES } from '@hyliren/shared';

const LABELS: Record<Locale, { flag: string; name: string }> = {
  'ko':    { flag: '🇰🇷', name: '한국어' },
  'zh-CN': { flag: '🇨🇳', name: '中文 (简)' },
  'ja':    { flag: '🇯🇵', name: '日本語' },
  'en':    { flag: '🇬🇧', name: 'English' },
};

interface LocaleTabsProps {
  active: Locale;
  sourceLocale: Locale;
  /** locale 별 "필수 필드 채움 여부" — 탭 뱃지 표시용 */
  completed: Partial<Record<Locale, boolean>>;
  onChange: (locale: Locale) => void;
}

/**
 * 번역 편집 영역 상단에 배치. 현재 선택된 locale 의 입력 영역만 노출.
 * sourceLocale 은 "원본*" 뱃지, 나머지는 "번역 완료" 체크 여부에 따라 뱃지 다름.
 */
export function LocaleTabs({ active, sourceLocale, completed, onChange }: LocaleTabsProps) {
  return (
    <div className="flex gap-0 border-b border-[var(--color-border)] mb-3">
      {LOCALES.map(loc => {
        const isActive = loc === active;
        const isSource = loc === sourceLocale;
        const isDone = completed[loc];
        const { flag, name } = LABELS[loc];
        return (
          <button
            key={loc}
            type="button"
            onClick={() => onChange(loc)}
            className={`
              flex items-center gap-1.5 px-3 py-2 text-[12px] font-medium
              border-b-2 transition-colors -mb-px
              ${isActive
                ? 'border-[var(--color-primary)] text-[var(--color-text)]'
                : 'border-transparent text-[var(--color-text-dim)] hover:text-[var(--color-text)]'}
            `}
          >
            <span className="text-[14px]">{flag}</span>
            <span>{name}</span>
            {isSource && (
              <span className="text-[10px] font-bold text-[var(--color-primary)]">*</span>
            )}
            {!isSource && isDone && (
              <span className="text-[10px] text-[var(--color-success,#16a34a)]">✓</span>
            )}
          </button>
        );
      })}
    </div>
  );
}

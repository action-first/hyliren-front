'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import { Check, Globe } from 'lucide-react';
import { isLocale, LOCALES, type Locale } from '@hyliren/shared';
import { useLocaleSwitch } from '@/hooks/use-locale-switch';

/**
 * 사용자 명시 언어 선택 — 드롭다운 형태.
 *
 * Note: 마이페이지에 동일 기능의 BottomSheet 가 있어 FOHeader 에선 사용하지 않음.
 * 본 컴포넌트는 추후 다른 위치(랜딩, footer 등) 에서 활용 가능하도록 유지.
 *
 * path navigation + DB 동기화는 `useLocaleSwitch` hook 에 위임 (DRY).
 */

const LABELS: Record<Locale, string> = {
  ko: '한국어',
  'zh-CN': '中文',
  ja: '日本語',
  en: 'English',
};

export function LanguageSwitcher() {
  const params = useParams();
  const currentLang =
    typeof params?.lang === 'string' && isLocale(params.lang) ? params.lang : 'zh-CN';
  const switchLocale = useLocaleSwitch();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  // 외부 클릭 시 닫힘
  useEffect(() => {
    if (!open) return;
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  function selectLocale(next: Locale) {
    setOpen(false);
    if (next === currentLang) return;
    switchLocale(next);
  }

  return (
    <div ref={ref} className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="fo-header-icon-btn border-0 bg-transparent cursor-pointer p-0"
        aria-label={LABELS[currentLang]}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <Globe size={20} strokeWidth={1.5} />
      </button>
      {open && (
        <ul
          role="listbox"
          aria-label="Language"
          className="absolute right-0 mt-2 min-w-[140px] rounded-lg border border-[var(--color-border)] bg-white shadow-lg z-50 py-1"
        >
          {LOCALES.map((l) => {
            const selected = l === currentLang;
            return (
              <li key={l}>
                <button
                  type="button"
                  role="option"
                  aria-selected={selected}
                  onClick={() => selectLocale(l)}
                  className={`w-full flex items-center justify-between gap-2 px-3 py-2 text-sm text-left hover:bg-[var(--color-bg-subtle)] ${
                    selected ? 'text-[var(--color-primary)] font-medium' : 'text-[var(--color-ink)]'
                  }`}
                >
                  <span>{LABELS[l]}</span>
                  {selected && <Check size={14} strokeWidth={2.5} />}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

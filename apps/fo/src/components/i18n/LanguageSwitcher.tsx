'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname, useParams } from 'next/navigation';
import { Check, Globe } from 'lucide-react';
import { isLocale, LOCALES, type Locale } from '@hyliren/shared';
import { useLocalizedRouter } from '@/hooks/use-localized-router';
import { useAuthStore } from '@/store/auth';
import { updateLocale } from '@/lib/api/auth';

/**
 * 사용자 명시 언어 선택 — 드롭다운 형태.
 *
 * 클릭 시:
 *   1. router.replace(`/${newLang}${restPath}`) — middleware 가 cookie 동기화
 *   2. 로그인 사용자면 PATCH /auth/locale fire-and-forget (디바이스 간 일관성)
 *
 * cookie 우선순위: 사용자 명시 선택은 path navigation 자체가 SSOT 변경.
 */

const LABELS: Record<Locale, string> = {
  ko: '한국어',
  'zh-CN': '中文',
  ja: '日本語',
  en: 'English',
};

export function LanguageSwitcher() {
  const router = useLocalizedRouter();
  const pathname = usePathname() ?? '/';
  const params = useParams();
  const currentLang =
    typeof params?.lang === 'string' && isLocale(params.lang) ? params.lang : 'zh-CN';
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn);
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

    // 현재 path 에서 lang prefix 제거 → 새 lang 으로 navigation
    // useLocalizedRouter 는 lang 자동 prefix 하므로, lang-stripped path 만 전달.
    // 다만 useLocalizedRouter 는 *현재* lang 기준으로 prefix 함 → 직접 raw path 사용.
    const stripped = pathname.replace(/^\/[a-z-]+(\/|$)/, '/');
    const newPath = `/${next}${stripped === '/' ? '' : stripped}`;

    // window.location 보단 router 가 RSC streaming + scroll 보존 — 단 useLocalizedRouter 는
    // 현재 lang prefix 를 자동 추가하므로 raw replace 는 next/navigation 의 useRouter 사용해야 함.
    // 우회: full navigation 으로 처리 (lang 변경은 layout 자체 재생성이 더 깔끔).
    if (typeof window !== 'undefined') {
      window.location.assign(newPath);
    }

    // 로그인 사용자: DB 동기화 (디바이스 간 일관성). 실패해도 UI 영향 없음.
    if (isLoggedIn) {
      void updateLocale(next).catch(() => {
        /* silent — locale 동기화 실패는 사용자 경험에 무관 */
      });
    }
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

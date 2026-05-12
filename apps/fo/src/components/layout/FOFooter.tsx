'use client';

import { Link } from '@/components/i18n/Link';
import { useLocaleStore } from '@/store/locale';

/**
 * FO 글로벌 footer — 법무 페이지 진입 동선 + copyright.
 *
 * 위치: [lang]/layout.tsx 의 main 영역 끝 (FOHeader 와 같은 layer, fo-frame 안).
 *      FOTabBar 가 fixed 로 floating 하므로 footer 는 main scroll 흐름 끝에 자연스럽게
 *      노출 → FOTabBar 의 padding-bottom 안에서 보이는 컨텐츠 끝 표시.
 *
 * 디자인:
 *   - 3 법무 링크 (privacy / terms / medical-disclaimer) 가로 분리자(·)로 단일 행
 *   - 그 아래 copyright 1줄
 *   - text-micro / dim color — 본문 흐름 방해 X
 *   - 4 lang 라벨 footer.* namespace 에서 가져옴 (mypage 와 분리)
 */
export function FOFooter() {
  const t = useLocaleStore(s => s.t);
  return (
    <footer className="px-5 pt-8 pb-6 mt-8 border-t border-[var(--color-border-light)]">
      <nav className="flex items-center justify-center gap-2 flex-wrap text-[11px] text-[var(--color-text-dim)]">
        <Link href="/privacy" className="no-underline text-[var(--color-text-dim)] hover:text-[var(--color-text)]">
          {t('footer.privacy')}
        </Link>
        <span aria-hidden="true">·</span>
        <Link href="/terms" className="no-underline text-[var(--color-text-dim)] hover:text-[var(--color-text)]">
          {t('footer.terms')}
        </Link>
        <span aria-hidden="true">·</span>
        <Link href="/medical-disclaimer" className="no-underline text-[var(--color-text-dim)] hover:text-[var(--color-text)]">
          {t('footer.medicalDisclaimer')}
        </Link>
      </nav>
      <p className="mt-3 text-center text-[10.5px] text-[var(--color-text-dim)]">
        {t('footer.copyright')}
      </p>
    </footer>
  );
}

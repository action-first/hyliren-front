'use client';

import { type ReactNode, useEffect } from 'react';
import { X } from 'lucide-react';

export interface SideSheetProps {
  open: boolean;
  onClose: () => void;
  /** 헤더 타이틀. ReactNode 허용(아이콘+텍스트 조합용). 미지정 시 헤더 미노출. */
  title?: ReactNode;
  /** 푸터 영역 — 액션 버튼 등. 미지정 시 푸터 미노출. */
  footer?: ReactNode;
  children: ReactNode;
  /**
   * sheet 너비. 기본 md.
   * - sm = 320px (컨펌 / 간단 메뉴)
   * - md = 400px (read-only 뷰 / 일반 작성, 표준)
   * - lg = 520px (복잡 form, 예외)
   */
  width?: 'sm' | 'md' | 'lg';
  /** 닫기 버튼(X) 노출 여부. 기본 true. */
  showClose?: boolean;
  /** ESC 키 / backdrop 클릭으로 닫기. 기본 true. */
  dismissable?: boolean;
  /** Close button aria-label (스크린 리더). 미지정 시 한국어 기본값. */
  closeLabel?: string;
}

export function SideSheet({
  open,
  onClose,
  title,
  footer,
  children,
  width = 'md',
  showClose = true,
  dismissable = true,
  closeLabel = '닫기',
}: SideSheetProps) {
  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (dismissable && e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose, dismissable]);

  if (!open) return null;

  return (
    <>
      <div
        className="side-sheet-backdrop"
        onClick={dismissable ? onClose : undefined}
        aria-hidden
      />
      <aside
        className={`side-sheet side-sheet--${width}`}
        role="dialog"
        aria-modal="true"
      >
        {(title !== undefined || showClose) && (
          <header className="side-sheet-header">
            <div className="side-sheet-title">{title}</div>
            {showClose && (
              <button
                type="button"
                onClick={onClose}
                className="side-sheet-close"
                aria-label={closeLabel}
              >
                <X size={18} />
              </button>
            )}
          </header>
        )}
        <div className="side-sheet-body">{children}</div>
        {footer && <footer className="side-sheet-footer">{footer}</footer>}
      </aside>
    </>
  );
}

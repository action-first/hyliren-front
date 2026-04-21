'use client';

import { type ReactNode } from 'react';
import { X } from 'lucide-react';

export interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  /** Handle 바 노출 여부 (기본 true) */
  showHandle?: boolean;
  /** X 닫기 버튼 노출 여부 (기본 false) */
  showClose?: boolean;
  /** 콘텐츠 스크롤 허용 여부 — 긴 폼/리포트용 (기본 false) */
  scrollable?: boolean;
  /** true이면 기본 px-6 pt-5 pb-8 패딩 제거 — 자체 헤더/레이아웃용 */
  noPadding?: boolean;
  /** backdrop 투명도 (기본 '30') */
  backdropOpacity?: '0' | '20' | '30' | '40' | '50';
}

export function BottomSheet({
  open,
  onClose,
  children,
  showHandle = true,
  showClose = false,
  scrollable = false,
  noPadding = false,
  backdropOpacity = '30',
}: BottomSheetProps) {
  if (!open) return null;

  const backdropClass = {
    '0': 'bg-black/0',
    '20': 'bg-black/20',
    '30': 'bg-black/30',
    '40': 'bg-black/40',
    '50': 'bg-black/50',
  }[backdropOpacity];

  const contentClass = noPadding
    ? `bg-[var(--color-bg,#fff)]${scrollable ? ' max-h-[90vh] overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden' : ''}`
    : `bg-[var(--color-bg,#fff)] px-6 pt-5 pb-8${scrollable ? ' max-h-[85vh] overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden' : ''}`;

  return (
    <>
      <div
        className={`fixed inset-0 ${backdropClass} z-50`}
        onClick={onClose}
      />
      <div className="fixed bottom-0 inset-x-0 mx-auto w-full max-w-[var(--fo-frame-max-width,480px)] z-50 rounded-t-3xl overflow-hidden animate-[slideUp_0.3s_ease-out]">
        <div
          className={contentClass}
          style={noPadding ? undefined : { boxShadow: 'var(--app-shadow-sheet)' }}
        >
          {!noPadding && (showHandle || showClose) && (
            <div className="relative mb-5">
              {showHandle && (
                <div className="w-10 h-1 rounded-full bg-[var(--color-border-light,#ebebeb)] mx-auto" />
              )}
              {showClose && (
                <button
                  type="button"
                  onClick={onClose}
                  className="absolute right-0 top-0 w-8 h-8 rounded-full bg-[var(--color-bg-secondary,#f7f7f7)] flex items-center justify-center border-0 cursor-pointer"
                >
                  <X size={16} className="text-[var(--color-text-dim,#929292)]" />
                </button>
              )}
            </div>
          )}
          {children}
        </div>
      </div>
    </>
  );
}

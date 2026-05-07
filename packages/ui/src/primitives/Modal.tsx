'use client';

import { useEffect, type ReactNode } from 'react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: string;
  /** Close button aria-label (스크린 리더). 미지정 시 한국어 기본값. */
  closeLabel?: string;
}

function Modal({ open, onClose, children, title, closeLabel = '닫기' }: ModalProps) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
      const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
      window.addEventListener('keydown', handleKey);
      return () => {
        document.body.style.overflow = '';
        window.removeEventListener('keydown', handleKey);
      };
    } else {
      document.body.style.overflow = '';
    }
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[var(--z-modal,60)] flex items-center justify-center p-[var(--spacing-4)]">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-[var(--color-surface,#fff)] rounded-[var(--app-radius,8px)] shadow-[var(--shadow-xl)] w-full max-w-[420px] max-h-[85vh] overflow-y-auto">
        {title && (
          <div className="flex items-center justify-between px-[var(--spacing-5)] py-[var(--spacing-4)] border-b border-[var(--color-border-light)]">
            <h2 className="text-[var(--text-md)] font-semibold text-[var(--color-text)]">{title}</h2>
            <button onClick={onClose} aria-label={closeLabel} className="w-8 h-8 flex items-center justify-center rounded-[var(--app-radius-sm)] hover:bg-[var(--color-bg-secondary)] text-[var(--color-text-dim)] cursor-pointer">
              ✕
            </button>
          </div>
        )}
        <div className="p-[var(--spacing-5)]">{children}</div>
      </div>
    </div>
  );
}

export { Modal };
export type { ModalProps };

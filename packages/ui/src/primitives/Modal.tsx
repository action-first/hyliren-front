'use client';

import { useEffect, type ReactNode } from 'react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: string;
}

function Modal({ open, onClose, children, title }: ModalProps) {
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[var(--z-modal)] flex items-center justify-center p-[var(--spacing-4)]">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-[var(--color-surface)] rounded-[var(--app-radius)] shadow-[var(--shadow-xl)] w-full max-w-md max-h-[85vh] overflow-y-auto">
        {title && (
          <div className="flex items-center justify-between p-[var(--spacing-4)] border-b border-[var(--color-border-light)]">
            <h2 className="text-[var(--text-lg)] font-semibold text-[var(--color-text)]">{title}</h2>
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[var(--color-bg-secondary)] text-[var(--color-text-dim)] cursor-pointer">
              ✕
            </button>
          </div>
        )}
        <div className="p-[var(--spacing-4)]">{children}</div>
      </div>
    </div>
  );
}

export { Modal };
export type { ModalProps };

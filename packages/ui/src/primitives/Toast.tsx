'use client';

import { useEffect, useState } from 'react';

export type ToastType = 'error' | 'success' | 'info';

export interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
}

const typeStyles: Record<ToastType, string> = {
  error: 'bg-[var(--color-danger-soft)] text-[var(--color-danger)] border-l-[3px] border-[var(--color-danger)]',
  success: 'bg-[var(--color-success-soft)] text-[var(--color-success)] border-l-[3px] border-[var(--color-success)]',
  info: 'bg-[var(--color-primary-soft)] text-[var(--color-primary)] border-l-[3px] border-[var(--color-primary)]',
};

function ToastCard({ toast, onDismiss }: { toast: ToastItem; onDismiss: () => void }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const showTimer = requestAnimationFrame(() => { setVisible(true); });
    const hideTimer = setTimeout(() => {
      setVisible(false);
      setTimeout(onDismiss, 200);
    }, 3000);
    return () => {
      cancelAnimationFrame(showTimer);
      clearTimeout(hideTimer);
    };
  }, [onDismiss]);

  return (
    <div
      onClick={() => { setVisible(false); setTimeout(onDismiss, 200); }}
      className={`
        w-[calc(100vw-32px)] max-w-[360px] cursor-pointer
        rounded-xl shadow-sm px-4 py-3
        text-[13px] font-medium
        border-l-[3px]
        transition-all duration-200 ease-out
        ${typeStyles[toast.type]}
        ${visible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}
      `}
    >
      {toast.message}
    </div>
  );
}

export interface ToastContainerProps {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
}

export function ToastContainer({ toasts, onDismiss }: ToastContainerProps) {
  if (!toasts || toasts.length === 0) return null;
  return (
    <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-2">
      {toasts.map(toast => (
        <ToastCard key={toast.id} toast={toast} onDismiss={() => onDismiss(toast.id)} />
      ))}
    </div>
  );
}

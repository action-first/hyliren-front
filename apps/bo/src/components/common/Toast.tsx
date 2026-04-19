'use client';

import { useEffect, useState } from 'react';
import { useToastStore } from '@/store/toast';

type ToastType = 'error' | 'success' | 'info';

interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
}

const typeStyles: Record<ToastType, string> = {
  error:   'bg-red-900 text-white',
  success: 'bg-[var(--color-text)] text-white',
  info:    'bg-[var(--color-primary)] text-white',
};

const typeIcons: Record<ToastType, string> = {
  error: '✕',
  success: '✓',
  info: 'ℹ',
};

function ToastCard({ toast, onDismiss }: { toast: ToastItem; onDismiss: () => void }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // 등장 애니메이션만 — 자동 dismiss는 store에서 관리
    const showTimer = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(showTimer);
  }, []);

  return (
    <div
      onClick={() => { setVisible(false); setTimeout(onDismiss, 200); }}
      className={`
        min-w-[240px] max-w-[360px] cursor-pointer
        rounded-xl shadow-lg px-4 py-3
        text-[13px] font-medium
        flex items-center gap-2.5
        transition-all duration-200 ease-out
        ${typeStyles[toast.type]}
        ${visible ? 'translate-y-0 opacity-100' : 'translate-y-3 opacity-0'}
      `}
    >
      <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-[11px] font-bold shrink-0">
        {typeIcons[toast.type]}
      </span>
      {toast.message}
    </div>
  );
}

export default function Toast() {
  const toasts = useToastStore((s: { toasts: ToastItem[] }) => s.toasts);
  const hideToast = useToastStore((s: { hideToast: (id: string) => void }) => s.hideToast);

  if (!toasts.length) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[var(--z-toast)] flex flex-col items-center gap-2">
      {toasts.map((toast: ToastItem) => (
        <ToastCard
          key={toast.id}
          toast={toast}
          onDismiss={() => hideToast(toast.id)}
        />
      ))}
    </div>
  );
}

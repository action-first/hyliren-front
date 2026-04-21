'use client';

import { ToastContainer } from '@hyliren/ui';
import { useToastStore } from '@/store/toast';

export default function Toast() {
  const toasts = useToastStore(s => s.toasts);
  const hideToast = useToastStore(s => s.hideToast);
  return <ToastContainer toasts={toasts} onDismiss={hideToast} />;
}

import { partnerTokenStore } from './token-store';

export function subscribePartnerStorageSync(
  onClear: () => void,
  onSet: () => void,
): () => void {
  if (typeof window === 'undefined') return () => {};

  const handler = (event: StorageEvent) => {
    if (event.key !== partnerTokenStore.TOKENS_KEY) return;
    if (!event.newValue) onClear();
    else onSet();
  };

  window.addEventListener('storage', handler);
  return () => window.removeEventListener('storage', handler);
}

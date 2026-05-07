import { adminTokenStore } from './token-store';

export function subscribeAdminStorageSync(
  onClear: () => void,
  onSet: () => void,
): () => void {
  if (typeof window === 'undefined') return () => {};

  const handler = (event: StorageEvent) => {
    if (event.key !== adminTokenStore.TOKENS_KEY) return;
    if (!event.newValue) onClear();
    else onSet();
  };

  window.addEventListener('storage', handler);
  return () => window.removeEventListener('storage', handler);
}

import { tokenStore } from './token-store';

/**
 * 멀티탭 로그인/로그아웃 동기화.
 * storage 이벤트는 "다른 탭"의 변경에만 발생하므로 현 탭 자신은 자체 액션으로 처리해야 한다.
 */
export function subscribeStorageSync(onTokensCleared: () => void, onTokensChanged: () => void): () => void {
  if (typeof window === 'undefined') { return () => {}; }

  function handleStorage(event: StorageEvent): void {
    if (event.key !== tokenStore.TOKENS_KEY) { return; }

    if (event.newValue === null || event.newValue === '') {
      onTokensCleared();
      return;
    }

    if (event.oldValue !== event.newValue) {
      onTokensChanged();
    }
  }

  window.addEventListener('storage', handleStorage);
  return () => { window.removeEventListener('storage', handleStorage); };
}

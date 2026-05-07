const TOKENS_KEY = 'hyliren-bo-tokens';

export interface AdminTokens {
  accessToken: string;
  refreshToken: string;
}

function read(): AdminTokens | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(TOKENS_KEY);
    return raw ? (JSON.parse(raw) as AdminTokens) : null;
  } catch {
    return null;
  }
}

function write(tokens: AdminTokens): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(TOKENS_KEY, JSON.stringify(tokens));
}

function clear(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(TOKENS_KEY);
}

export const adminTokenStore = {
  getAccessToken: () => read()?.accessToken ?? null,
  getRefreshToken: () => read()?.refreshToken ?? null,
  setTokens: (tokens: AdminTokens) => write(tokens),
  clearTokens: () => clear(),
  TOKENS_KEY,
};

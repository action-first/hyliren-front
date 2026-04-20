const TOKENS_KEY = 'hyliren-tokens';

interface Tokens {
  accessToken: string;
  refreshToken: string;
}

function read(): Tokens | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(TOKENS_KEY);
    return raw ? (JSON.parse(raw) as Tokens) : null;
  } catch {
    return null;
  }
}

function write(tokens: Tokens): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(TOKENS_KEY, JSON.stringify(tokens));
}

function clear(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(TOKENS_KEY);
}

export const tokenStore = {
  getAccessToken: () => read()?.accessToken ?? null,
  getRefreshToken: () => read()?.refreshToken ?? null,
  setTokens: (tokens: Tokens) => write(tokens),
  clearTokens: () => clear(),
  TOKENS_KEY,
};

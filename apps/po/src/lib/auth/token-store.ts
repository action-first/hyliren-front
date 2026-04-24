const TOKENS_KEY = 'hyliren-po-tokens';

export interface PartnerTokens {
  accessToken: string;
  refreshToken: string;
}

function read(): PartnerTokens | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(TOKENS_KEY);
    return raw ? (JSON.parse(raw) as PartnerTokens) : null;
  } catch {
    return null;
  }
}

function write(tokens: PartnerTokens): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(TOKENS_KEY, JSON.stringify(tokens));
}

function clear(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(TOKENS_KEY);
}

export const partnerTokenStore = {
  getAccessToken: () => read()?.accessToken ?? null,
  getRefreshToken: () => read()?.refreshToken ?? null,
  setTokens: (tokens: PartnerTokens) => write(tokens),
  clearTokens: () => clear(),
  TOKENS_KEY,
};

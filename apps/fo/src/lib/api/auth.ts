import type { Locale, User, UserRole } from '@hyliren/shared';
import { request, setTokens, clearTokens } from './client';

interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface RegisterInput {
  email: string;
  password: string;
  name: string;
  phone?: string;
  locale?: Locale;
}

interface RawMeResponse {
  id: string;
  role: string;
  email: string | null;
  phone: string | null;
  name: string;
  locale: string;
  avatarUrl: string | null;
  referralCode: string | null;
  referredBy: string | null;
  createdAt: string;
  updatedAt: string;
}

// API UserRole('buyer'|'admin')와 FO UserRole('buyer'|'referrer')가 다르므로 안전 매핑.
function narrowRole(role: string): UserRole {
  return role === 'referrer' ? 'referrer' : 'buyer';
}

function narrowLocale(locale: string): Locale {
  return locale === 'zh-CN' ? 'zh-CN' : 'ko';
}

function toUser(raw: RawMeResponse): User {
  return {
    id: raw.id,
    role: narrowRole(raw.role),
    email: raw.email,
    phone: raw.phone,
    name: raw.name,
    locale: narrowLocale(raw.locale),
    avatarUrl: raw.avatarUrl,
    referralCode: raw.referralCode,
    referredBy: raw.referredBy,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  };
}

export async function login(input: LoginInput): Promise<TokenPair> {
  const tokens = await request<TokenPair>('/auth/login', {
    method: 'POST',
    auth: false,
    body: input,
  });
  setTokens(tokens);
  return tokens;
}

export async function register(input: RegisterInput): Promise<TokenPair> {
  const tokens = await request<TokenPair>('/auth/register', {
    method: 'POST',
    auth: false,
    body: {
      email: input.email,
      password: input.password,
      name: input.name,
      phone: input.phone,
      locale: input.locale ?? 'zh-CN',
    },
  });
  setTokens(tokens);
  return tokens;
}

export async function logout(): Promise<void> {
  try {
    await request<void>('/auth/logout', { method: 'POST' });
  } finally {
    clearTokens();
  }
}

export async function fetchMe(): Promise<User> {
  const raw = await request<RawMeResponse>('/auth/me', { method: 'GET' });
  return toUser(raw);
}

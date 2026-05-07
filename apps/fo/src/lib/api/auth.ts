import { narrowLocale, type Locale, type User, type UserRole } from '@hyliren/shared';
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

// DB user_role AS ENUM ('buyer', 'admin'). 알 수 없는 값은 buyer 로 폴백.
function narrowRole(role: string): UserRole {
  return role === 'admin' ? 'admin' : 'buyer';
}

function toUser(raw: RawMeResponse): User {
  return {
    id: raw.id,
    role: narrowRole(raw.role),
    email: raw.email,
    phone: raw.phone,
    name: raw.name,
    // FO 사용자 미지정 시 'zh-CN' 기본 — Customer DB users.locale DEFAULT 와 일치.
    locale: narrowLocale(raw.locale, 'zh-CN'),
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

/**
 * 사용자 표시 언어 변경 — users.locale DB 갱신.
 *
 * UX: locale 스위처에서 선택 시 store 즉시 반영(낙관적 UI) + 본 호출은 silent fail.
 * 디바이스 간 일관성 (다음 로그인 시 다른 디바이스에서도 복원) 을 위한 동기화 용도.
 */
export async function updateLocale(locale: Locale): Promise<void> {
  await request<void>('/auth/locale', { method: 'PATCH', body: { locale } });
}

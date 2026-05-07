/**
 * BO 인증 server env reader.
 *
 * NEXT_PUBLIC_* 가 아닌 server-only env. 노출되면 안 되는 secret/credential 들.
 * - mock 모드 dev admin 자격 (이메일·비밀번호) 은 평문이라 .env.local 에만.
 * - 운영 환경엔 실 BE auth 로 전환되며 본 모듈의 mock 분기는 사용 안 됨.
 */

export type BoAuthMode = 'mock' | 'db' | 'real';

export interface BoServerAuthEnv {
  mode: BoAuthMode;
  /** HMAC 서명용 secret. 32자 이상 random hex 권장. */
  secret: string;
  /** session cookie name. */
  cookieName: string;
  /** session 만료 시간 (ms). 기본 8h. */
  sessionTtlMs: number;
  /** mock 모드 한정 — admin 이메일. */
  devAdminEmail: string | null;
  /** mock 모드 한정 — admin 비밀번호 (평문). 운영 환경에서 사용 금지. */
  devAdminPassword: string | null;
  /** mock 모드 한정 — admin 표시 이름. */
  devAdminName: string;
  /** real 모드 한정 — backend admin API base URL (server-to-server). */
  backendUrl: string | null;
}

export function readServerAuthEnv(): BoServerAuthEnv {
  const raw = process.env.BO_AUTH_MODE;
  const mode: BoAuthMode = raw === 'real' ? 'real' : raw === 'db' ? 'db' : 'mock';
  return {
    mode,
    secret: process.env.BO_AUTH_SECRET ?? '',
    cookieName: process.env.BO_SESSION_COOKIE ?? 'bo-session',
    sessionTtlMs: Number(process.env.BO_SESSION_TTL_MS ?? 8 * 60 * 60 * 1000),
    devAdminEmail: process.env.BO_DEV_ADMIN_EMAIL ?? null,
    devAdminPassword: process.env.BO_DEV_ADMIN_PASSWORD ?? null,
    devAdminName: process.env.BO_DEV_ADMIN_NAME ?? '운영 계정',
    backendUrl: process.env.BO_BACKEND_URL ?? null,
  };
}

/**
 * production 안전 가드 — secret 미설정·짧은 값 차단.
 * runtime 검증이라 빌드는 통과하지만 실제 호출 시점에 fail-fast.
 */
export function assertReadyForRuntime(env: BoServerAuthEnv): void {
  if (!env.secret || env.secret.length < 32) {
    throw new Error('BO_AUTH_SECRET 미설정 또는 너무 짧음 (32자+ 권장)');
  }
  if (env.mode === 'mock') {
    if (!env.devAdminEmail || !env.devAdminPassword) {
      throw new Error('BO_AUTH_MODE=mock 인데 BO_DEV_ADMIN_EMAIL/PASSWORD 미설정');
    }
  } else if (env.mode === 'db') {
    // db 모드: @hyliren/db (Prisma) 가 DATABASE_URL 을 사용. BO 자체엔 추가 env 불필요.
    // DATABASE_URL 누락은 Prisma client 가 첫 query 시점에 throw 하므로 별도 검증 생략.
  } else if (env.mode === 'real') {
    if (!env.backendUrl) {
      throw new Error('BO_AUTH_MODE=real 인데 BO_BACKEND_URL 미설정');
    }
  }
}

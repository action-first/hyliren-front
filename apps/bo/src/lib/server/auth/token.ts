/**
 * BO session 토큰 — HMAC 서명 기반 stateless token.
 *
 * 외부 JWT 라이브러리 의존 없이 Node 빌트인 crypto 만으로 구현.
 * 형식: `<base64url(payload)>.<base64url(hmac-sha256(payload))>`
 *  - payload = `${email}|${expiry-ms}` 평문
 *  - 서명 검증으로 위변조 차단, 만료 검증으로 session 길이 제한
 *
 * 평문 payload 라 민감 정보(=password 등) 절대 넣지 말 것.
 * 현재 admin 운영자 식별 용도로 email 만 담고, 추가 정보(name/role)는
 * 서버에서 검증 시점에 resolve.
 *
 * Edge runtime 호환 — Web Crypto API 사용 (middleware.ts 에서도 import 가능).
 */

const encoder = new TextEncoder();

function base64UrlEncode(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64UrlDecode(input: string): Uint8Array {
  const pad = input.length % 4 === 0 ? '' : '='.repeat(4 - (input.length % 4));
  const b64 = (input + pad).replace(/-/g, '+').replace(/_/g, '/');
  const binary = atob(b64);
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i);
  return out;
}

async function importKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify'],
  );
}

export interface SessionPayload {
  email: string;
  expiry: number;
}

export async function signSession(
  secret: string,
  email: string,
  ttlMs: number,
): Promise<string> {
  if (!secret) throw new Error('signSession: secret missing');
  const expiry = Date.now() + ttlMs;
  const payloadStr = `${email}|${expiry}`;
  const payloadB64 = base64UrlEncode(encoder.encode(payloadStr));
  const key = await importKey(secret);
  const sigBuf = await crypto.subtle.sign('HMAC', key, encoder.encode(payloadB64));
  const sigB64 = base64UrlEncode(new Uint8Array(sigBuf));
  return `${payloadB64}.${sigB64}`;
}

export async function verifySession(
  secret: string,
  token: string,
): Promise<SessionPayload | null> {
  if (!secret || !token) return null;
  const dotIdx = token.indexOf('.');
  if (dotIdx <= 0) return null;
  const payloadB64 = token.slice(0, dotIdx);
  const sigB64 = token.slice(dotIdx + 1);
  if (!payloadB64 || !sigB64) return null;

  let valid = false;
  try {
    const key = await importKey(secret);
    const sigBytes = base64UrlDecode(sigB64);
    // Uint8Array → fresh ArrayBuffer copy (SharedArrayBuffer 호환 회피).
    const sigBuf = new ArrayBuffer(sigBytes.byteLength);
    new Uint8Array(sigBuf).set(sigBytes);
    valid = await crypto.subtle.verify('HMAC', key, sigBuf, encoder.encode(payloadB64));
  } catch {
    return null;
  }
  if (!valid) return null;

  let payloadStr: string;
  try {
    payloadStr = new TextDecoder().decode(base64UrlDecode(payloadB64));
  } catch {
    return null;
  }
  const sep = payloadStr.indexOf('|');
  if (sep < 0) return null;
  const email = payloadStr.slice(0, sep);
  const expiry = Number(payloadStr.slice(sep + 1));
  if (!email || !Number.isFinite(expiry) || expiry < Date.now()) return null;
  return { email, expiry };
}

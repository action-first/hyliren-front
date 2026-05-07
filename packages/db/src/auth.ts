import bcrypt from 'bcrypt';
import { prisma } from './index';
import type { Member } from '@prisma/client';

/**
 * @hyliren/db — admin auth helpers.
 *
 * BO admin 인증 전용 helper. apps/bo 가 prisma·bcrypt 를 직접 다루지 않고
 * 본 모듈을 통해 admin 자격 검증·조회만 수행.
 *
 * 정본 schema 의 members 테이블 (role='admin') 만 대상. role !== 'admin' 은 401.
 *
 * 비밀번호 비교: bcrypt.compare (timing-safe). passwordHash 가 null 이면 거부.
 */

export interface VerifyAdminInput {
  email: string;
  password: string;
}

/**
 * 자격 검증 — 일치 시 Member 반환, 아니면 null.
 *
 * 거부 케이스 (모두 null):
 *   - 이메일에 매칭되는 row 없음
 *   - row 가 admin 이 아님 (role='partner')
 *   - passwordHash 가 null (소셜 로그인 등 향후 케이스)
 *   - bcrypt.compare 불일치
 */
export async function verifyAdminCredentials(
  input: VerifyAdminInput,
): Promise<Member | null> {
  const email = input.email.trim().toLowerCase();
  const member = await prisma.member.findUnique({ where: { email } });
  if (!member) return null;
  if (member.role !== 'admin') return null;
  if (!member.passwordHash) return null;
  const ok = await bcrypt.compare(input.password, member.passwordHash);
  return ok ? member : null;
}

/**
 * Email → admin Member resolve (검증 없이 조회만).
 *
 * BO 의 /me endpoint 가 cookie 검증 통과 후 admin 정보 응답할 때 사용.
 * role='admin' 이 아니면 null (혹시 partner 로 변경된 경우 등 안전장치).
 */
export async function getAdminByEmail(email: string): Promise<Member | null> {
  const normalized = email.trim().toLowerCase();
  const member = await prisma.member.findUnique({ where: { email: normalized } });
  if (!member || member.role !== 'admin') return null;
  return member;
}

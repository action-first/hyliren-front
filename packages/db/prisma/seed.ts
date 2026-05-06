/**
 * 초기 admin 계정 seed.
 *
 * 사용:
 *   1. packages/db/.env 에 DATABASE_URL 과 SEED_ADMIN_* 채움
 *   2. pnpm --filter @hyliren/db prisma:migrate    (스키마 적용)
 *   3. pnpm --filter @hyliren/db prisma:seed       (admin 계정 생성)
 *
 * 멱등성: 같은 이메일이 이미 있으면 건너뜀 (재실행 안전).
 * 비밀번호: bcrypt (cost 12) 해시 후 저장 — 평문 비밀번호는 .env 에서 즉시 제거 권장.
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';

const prisma = new PrismaClient();

const BCRYPT_ROUNDS = 12;

function generateMemberId(): string {
  // 28자 영숫자 ID. 충돌 가능성 무시할 만큼 낮음 (162 bits entropy).
  // final.sql 의 VARCHAR(28) 와 일치.
  return randomBytes(21).toString('base64url').slice(0, 28);
}

async function main() {
  const email = process.env.SEED_ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.SEED_ADMIN_PASSWORD;
  const name = process.env.SEED_ADMIN_NAME ?? '운영자';

  if (!email || !password) {
    throw new Error(
      'SEED_ADMIN_EMAIL · SEED_ADMIN_PASSWORD 가 .env 에 없습니다. ' +
      'packages/db/.env.example 참고해서 채워주세요.',
    );
  }
  if (password.length < 8) {
    throw new Error('SEED_ADMIN_PASSWORD 가 너무 짧음 — 최소 8자 권장.');
  }

  const existing = await prisma.member.findUnique({ where: { email } });
  if (existing) {
    console.log(`[seed] admin 이미 존재 (id=${existing.memberId}, email=${email}) — skip`);
    return;
  }

  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
  const memberId = generateMemberId();

  const created = await prisma.member.create({
    data: {
      memberId,
      role: 'admin',
      email,
      passwordHash,
      name,
    },
  });

  await prisma.adminAuditLog.create({
    data: {
      memberId: created.memberId,
      action: 'admin_seed',
      detail: { reason: 'initial admin bootstrap', name },
    },
  });

  console.log(`[seed] admin 생성 완료`);
  console.log(`       member_id : ${created.memberId}`);
  console.log(`       email     : ${created.email}`);
  console.log(`       name      : ${created.name}`);
  console.log(`       *.env 에서 SEED_ADMIN_PASSWORD 평문은 즉시 제거 권장.`);
}

main()
  .catch((e) => {
    console.error('[seed] 실패:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

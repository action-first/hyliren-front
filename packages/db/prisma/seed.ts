/**
 * 초기 admin 계정 seed.
 *
 * 정본 schema (hyliren-api/docker/init.sql) 의 members 테이블에 role='admin' row 1 개를
 * 생성. 같은 테이블의 events 테이블에 'admin_seed' 이벤트 기록 (audit 추적).
 *
 * 사용:
 *   1. packages/db/.env 에 DATABASE_URL · SEED_ADMIN_* 채움
 *   2. pnpm --filter @hyliren/db prisma:seed
 *
 * 멱등성: 같은 이메일이 이미 있으면 건너뜀 (재실행 안전).
 * 비밀번호: bcrypt (cost 12) 해시 후 저장 — 평문은 .env 에서 즉시 제거 권장.
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

  // 정본 events 테이블에 audit 기록 (별도 admin_audit_log 신설 회피).
  // event_id 는 28자 영숫자, actor_type='member' (admin 도 members 테이블), event_type='admin_seed'.
  const eventId = generateMemberId();
  await prisma.$executeRawUnsafe(
    `INSERT INTO events (event_id, event_type, actor_type, actor_id, metadata)
     VALUES ($1, 'admin_seed', 'member', $2, $3::jsonb)`,
    eventId,
    created.memberId,
    JSON.stringify({ reason: 'initial admin bootstrap', name }),
  );

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

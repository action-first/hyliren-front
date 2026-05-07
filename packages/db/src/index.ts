import { PrismaClient } from '@prisma/client';

/**
 * @hyliren/db — 단일 PrismaClient.
 *
 * Next.js 의 dev server HMR 환경에서 새로고침마다 PrismaClient 가 재생성되며
 * "too many connections" 으로 DB 가 막히는 문제 회피용 globalThis 캐시.
 *
 * 운영 환경에선 매번 새 인스턴스 (build 마다 1개).
 */
declare global {
  // eslint-disable-next-line no-var
  var __mimyoPrisma: PrismaClient | undefined;
}

export const prisma: PrismaClient =
  globalThis.__mimyoPrisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalThis.__mimyoPrisma = prisma;
}

// Prisma 가 자동 생성하는 model 타입을 같이 re-export 하면 호출처 import 가 단순해짐.
export type { Member, MemberRole } from '@prisma/client';

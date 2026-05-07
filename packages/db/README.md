# @hyliren/db

MIMYO 의 Prisma · PostgreSQL 단일 통합 패키지.

정본 schema 는 [`docs/schema/final.sql`](../../docs/schema/final.sql) (21 tables 전체).
본 패키지의 `prisma/schema.prisma` 는 launch scope (auth + admin audit) 우선 반영본.

---

## 셋업 (최초 1회)

### 1. 의존성 설치

```bash
pnpm install
```

### 2. 환경 변수 등록

```bash
cp packages/db/.env.example packages/db/.env
# packages/db/.env 열어서 DATABASE_URL · SEED_ADMIN_* 채움
```

### 3. 마이그레이션 실행

```bash
pnpm --filter @hyliren/db prisma:migrate
```

처음이면 `prisma/migrations/` 가 생성됩니다.

### 4. 첫 admin 계정 seed

```bash
pnpm --filter @hyliren/db prisma:seed
```

성공하면 `member_id`, `email` 출력. 이후 BO 로그인 가능 (해당 email + password).

---

## 사용 (apps 에서 import)

```ts
import { prisma } from '@hyliren/db';

const admin = await prisma.member.findUnique({
  where: { email: 'admin@mi-myo.com' },
});
```

---

## 운영 배포

Vercel 환경 변수에 동일 키 등록:

```
DATABASE_URL=postgresql://USER:PASS@HOST:5432/hyliren?sslmode=require
DIRECT_URL=...    # PgBouncer 등 pooler 쓸 때만
```

배포 시 `prisma migrate deploy` 가 실행되도록 build 단계에 포함.

```bash
# apps/{fo,po,bo}/package.json 의 build script 보강 예시
"build": "prisma migrate deploy && next build"
```

---

## 비밀번호 정책

bcrypt cost 12. 운영에선 cost 14 권장 (CPU 부담 vs 보안 trade-off).

`SEED_ADMIN_PASSWORD` 는 seed 1회 실행용이며, 실행 후 `.env` 에서 평문 제거 필수.
이후 비밀번호 재설정은 BO admin UI 또는 직접 DB 접근 (cli) 으로.

---

## Prisma Studio

DB 내용 GUI 로 확인:

```bash
pnpm --filter @hyliren/db prisma:studio
```

→ http://localhost:5555

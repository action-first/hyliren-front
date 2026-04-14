# Architecture & Build Plan

## Architecture Guardrails (위반 금지)

1. **Identity 분리** — User(수요) / Member(공급) 별도 테이블, 별도 온보딩
2. **Core entity 5개만** — User, Member, Concern, Proposal, Order
3. **매칭 채널 하나만** — Concern(입력) → Proposal(출력)
4. **Proposal 구조화** — 자유 텍스트 금지, 고정 스키마 필드
5. **상태 기반 시스템** — entity status가 흐름 결정, UI 로직 금지
6. **FO/PO/BO 물리 분리** — 앱/라우트/레이아웃 모두 분리
7. **토큰 기반 디자인** — 인라인 스타일 금지
8. **Day 1 i18n** — 하드코딩 문자열 금지
9. **Order = 상품** — 모든 구매는 Order entity, 임시 결제 금지
10. **Article = first-class** — 블로그 아님, 전환 퍼널 진입점
11. **Day 1 이벤트 트래킹** — 나중에 추가 금지
12. **Mock = 실제 시나리오** — 빈 데이터 금지
13. **임시 구조 금지** — "나중에 리팩토링" 금지

## Tech Stack

| Layer | Choice |
|-------|--------|
| Monorepo | Turborepo + pnpm |
| Frontend | Next.js App Router + React |
| Styling | Tailwind CSS v4 |
| State | Zustand (client) + React Query (server) |
| Form | React Hook Form + Zod |
| i18n | next-intl (ko + zh-CN) |
| Backend (MVP) | Next.js API Routes |
| ORM | Prisma |
| DB | PostgreSQL (Supabase) |
| Content | MDX (SSG) |
| Deploy | Vercel (3앱 독립) |

## 폴더 구조

```
hyliren/
├── apps/
│   ├── fo/                     ← User(고객) 전용
│   ├── po/                     ← Member(병원) 전용
│   └── bo/                     ← Member(관리자) 전용
├── packages/
│   ├── ui/                     ← 토큰 + 프리미티브
│   ├── shared/                 ← 타입 + 유틸 + 상태 전이 로직
│   └── i18n/                   ← 다국어
└── docs/harness/
```

## 화면 목록 (MVP, 22개)

### FO — User 도메인 (10개)
| Screen | Route |
|--------|-------|
| 랜딩 | `/` |
| 가입/로그인 | `/signup`, `/login` |
| 고민 등록 | `/concerns/new` |
| 고민 상태 | `/concerns/[id]` |
| 제안서 리스트 | `/concerns/[id]/proposals` |
| 제안서 비교 | `/concerns/[id]/compare` |
| 리포트 구매/결과 | `/reports/[concernId]` |
| 서비스 탐색 | `/services` |
| 아티클 리스트 | `/articles` |
| 아티클 상세 | `/articles/[slug]` |

### PO — Member(partner) 도메인 (6개)
| Screen | Route |
|--------|-------|
| 대시보드 | `/dashboard` |
| 고민 리스트 | `/concerns` |
| 고민 상세 | `/concerns/[id]` |
| 제안서 작성 | `/concerns/[id]/propose` |
| 발송 내역 | `/proposals` |
| 크레딧 관리 | `/credits` |

### BO — Member(admin) 도메인 (6개)
| Screen | Route |
|--------|-------|
| 대시보드 | `/dashboard` |
| 고객 관리 | `/buyers` |
| 병원 관리 | `/partners` |
| 제안서 관리 | `/proposals` |
| 매출 현황 | `/revenue` |
| 콘텐츠 관리 | `/articles` |

## Build Order

### Phase 0 — Foundation (3일)
- Turborepo + pnpm + 3앱 boilerplate
- packages/shared: 타입 + 상태 전이 로직 + Zod 스키마
- packages/ui: 토큰 + Button/Input/Card
- Prisma schema + Supabase 연결
- i18n 구조
- Event tracking 구조

### Phase 1 — 핵심 플로우 (2주)
- FO: 랜딩 → 고민 등록 → 제안서 리스트/비교
- PO: 대시보드 → 고민 열람 → 제안서 작성/발송
- BO: 대시보드 → 고객/병원/제안서 관리
- Mock data (실제 시나리오 기반)

### Phase 2 — 수익 + 콘텐츠 (2주)
- FO: 리포트 구매 + 서비스 탐색
- FO: 아티클 시스템 (MDX + SSG + CTA)
- PO: 크레딧 관리
- BO: 매출 + 콘텐츠 관리
- i18n 메시지 완성

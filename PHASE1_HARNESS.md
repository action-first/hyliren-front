# PHASE 1 HARNESS — HYLIREN MVP

> 이 문서를 읽지 않고 코드를 작성하지 않는다.
> 변경이 생기면 이 문서를 먼저 업데이트한다.

---

## 1. Product Understanding

### 이 제품이 뭔가

중국 소비자가 성형 고민을 등록하면, 한국 병원이 구조화된 제안서를 보내고, 고객이 비교/검증/선택한 뒤 부가서비스를 구매하는 플랫폼.

### 이 제품이 아닌 것

- 병원 검색앱 아님
- 채팅앱 아님
- 예약 대행 아님

### Core BM Flow (훼손 금지)

```
중국 고객 유입 → 고민 등록 → 병원 제안서 → 비교 → (리포트) → 직접 예약 → (부가서비스)
```

### 수요/공급 분리 (절대 원칙)

| | 수요 (User) | 공급 (Member) |
|---|-------------|---------------|
| 앱 | FO | PO, BO |
| 테이블 | users, buyer_profiles | members, partner_profiles |
| 행위 | 고민 등록, 비교, 구매 | 제안서 작성, 크레딧 소비 |
| 연결 | Concern (입력) | Proposal (출력) |

### 매칭 채널은 하나뿐

```
User → Concern → Proposal ← Member
```

다이렉트 메시징, 제안서 없는 예약, 자유형 연락 전부 금지.

---

## 2. Phase 1 MVP Definition

### 목표

**"고민 등록 → 제안서 발송 → 비교"** 전체 루프가 mock data로 동작하는 것.

### Phase 1 범위 (In Scope)

| Domain | 화면 | 핵심 |
|--------|------|------|
| Foundation | 모노레포, 디자인 시스템, 타입, i18n 구조 | 뼈대 |
| FO | 랜딩, 가입, 고민 등록, 제안서 리스트/비교 | 고객 핵심 플로우 |
| PO | 대시보드, 고민 열람, 제안서 작성/발송 | 병원 핵심 플로우 |
| BO | 대시보드, 고객/병원/제안서 관리 | 운영 가시성 |

### Phase 1 제외 (Out of Scope)

- 실제 결제/정산
- 리포트 엔진
- 서비스 주문
- 아티클 시스템
- 실제 인증 (Supabase Auth)
- 실제 DB 연결 (mock data only)

### 성공 기준

1. FO: 고민 등록 → 제안서 도착 → 2개 이상 비교 가능
2. PO: 고민 열람 → 제안서 2~3분 내 작성 → 발송 가능
3. BO: 전체 퍼널(고민 수, 제안서 수, 상태 분포) 한 화면에서 파악 가능
4. 3개 앱 독립 실행 (`pnpm dev --filter fo`, `--filter po`, `--filter bo`)
5. i18n: 모든 문자열 키 기반, ko/zh-CN 전환 가능
6. 디자인: FO ≠ PO/BO 톤 분리 확인

---

## 3. Domain Breakdown

### Core Entities & 앱별 책임

| Entity | FO (읽기/쓰기) | PO (읽기/쓰기) | BO (읽기/쓰기) |
|--------|---------------|---------------|---------------|
| User | 쓰기 (가입) | — | 읽기 |
| BuyerProfile | 쓰기 | — | 읽기 |
| Member | — | 읽기 (본인) | 읽기/쓰기 |
| PartnerProfile | — | 쓰기 (본인) | 읽기 |
| Concern | 쓰기 (등록) | 읽기 (리스트) | 읽기 |
| ConcernPhoto | 쓰기 | 읽기 | 읽기 |
| Proposal | 읽기 (비교) | 쓰기 (작성/발송) | 읽기 |
| ProposalItem | 읽기 | 쓰기 | 읽기 |
| CreditBalance | — | 읽기 | 읽기 |
| CreditTransaction | — | 읽기 | 읽기 |

### 상태 전이 (Phase 1 범위)

**Concern.status** — 이 상태가 전체 흐름을 결정

```
draft → submitted → proposal_received → comparing
```

| 트리거 | 전이 | 앱 |
|--------|------|-----|
| 고객이 제출 | draft → submitted | FO |
| 첫 제안서 sent | submitted → proposal_received | PO (자동) |
| 고객이 2개+ shortlist | proposal_received → comparing | FO (자동) |

**Proposal.status** — Phase 1 범위

```
draft → sent → viewed → shortlisted
```

| 트리거 | 전이 | 앱 |
|--------|------|-----|
| 병원이 저장 | → draft | PO |
| 병원이 발송 | draft → sent | PO |
| 고객이 열람 | sent → viewed | FO (자동) |
| 고객이 비교 선택 | viewed → shortlisted | FO |

### 상태 전이 로직 위치

`packages/shared/src/domain/transitions.ts`

UI 컴포넌트 안에서 if/else로 상태 제어 금지.
모든 전이는 이 파일의 함수를 호출해야 함.

---

## 4. User Flow

### FO — 모바일 퍼스트 UX 원칙

FO의 모든 화면은 **모바일 한 손 사용** 기준으로 설계한다.
데스크톱은 모바일 레이아웃을 확장하는 방식이며, 데스크톱 전용 레이아웃을 먼저 만들지 않는다.

**CTA 배치**: 모든 주요 액션은 모바일 하단 thumb zone에 고정 (sticky bottom)
**비교 UI**: 모바일에서는 카드 스와이프 비교 또는 bottom sheet 전환, 테이블 비교 금지
**정보 밀도**: 한 화면에 스캔 가능한 수준만. 스크롤 깊이 > 정보 밀도
**진입점**: 랜딩 → 고민 등록은 **2탭 이내**로 도달

### FO — 고객 플로우 (Phase 1)

```
랜딩 (/)
  └─ 하단 고정 CTA: "무료 상담 시작하기" (thumb zone)
       ↓
가입/로그인 (/signup, /login)
  └─ phone 또는 email (중국 고객: phone 우선)
       ↓
고민 등록 (/concerns/new)  ← 풀스크린 멀티스텝
  ├─ Step 1: 부위 선택 (큰 카드 탭, 한 화면에 6개)
  ├─ Step 2: 사진 업로드 (카메라/갤러리, 1~5장)
  ├─ Step 3: 고민 텍스트 + 예산 슬라이더 + 방문 시기 + 여권
  ├─ 각 스텝 하단에 "다음" 고정 버튼
  └─ 제출 → concern.status = 'submitted'
       ↓
대기 (/concerns/[id])
  └─ 상태 카드: "제안서가 도착하면 알려드릴게요" + 예상 소요
       ↓ [제안서 도착 시 — push/알림]
제안서 리스트 (/concerns/[id]/proposals)
  └─ 세로 카드 리스트 (Airbnb 스타일):
       ├─ 병원 로고 + 이름
       ├─ 총 가격 (큰 텍스트)
       ├─ 회복기간 · 마취 · 입원 (태그)
       ├─ 시술 항목 요약 (최대 3개)
       └─ "비교 담기" 버튼
       ↓
제안서 비교 (/concerns/[id]/compare)
  └─ 모바일: 카드 스와이프 비교 (좌우 넘기며 항목별 비교)
     데스크톱: 2~3개 나란히 카드 비교
     하단 고정: "이 제안서 선택하기"
```

### PO — 병원 플로우 (Phase 1)

```
로그인 (/login)
  └─ email
       ↓
대시보드 (/dashboard)
  ├─ 오늘 새 고민 수
  ├─ 발송한 제안서 수
  ├─ 크레딧 잔액
  └─ 최근 고민 리스트 미리보기
       ↓
고민 리스트 (/concerns)
  └─ 필터: 부위, 예산 범위, 방문 시기
       ↓
고민 상세 (/concerns/[id])
  └─ 사진, 고민 텍스트, 예산, 방문 시기, 여권 여부
       ↓
제안서 작성 (/concerns/[id]/propose)
  ├─ 시술 항목 (복수 추가)
  │   ├─ 시술명 (ko + zh)
  │   └─ 항목 가격
  ├─ 총 가격 (권위 값, 수동 입력)
  ├─ 회복 기간
  ├─ 마취 유형 (local/sedation/general)
  ├─ 입원 기간
  ├─ 시술 가능 기간
  ├─ 부연 설명 (선택, free text)
  └─ 발송 → proposal.status = 'sent', 크레딧 차감
       ↓
발송 내역 (/proposals)
  └─ 열람 상태 추적 (sent → viewed → shortlisted)
```

### BO — 관리자 플로우 (Phase 1)

```
로그인 (/login)
       ↓
대시보드 (/dashboard)
  ├─ 퍼널: 고민 수 → 제안서 수 → 비교 중 수
  ├─ 오늘 KPI: 신규 고민, 신규 제안서, 활성 고객
  └─ 상태 분포 차트
       ↓
고객 관리 (/buyers)
  └─ 테이블: 이름, 가입일, 고민 수, 최신 상태
       ↓
고객 상세 (/buyers/[id])
  └─ 타임라인: 고민 → 제안서 도착 → 비교 시작 ...
       ↓
병원 관리 (/partners)
  └─ 테이블: 병원명, 구독, 크레딧, 제안서 수
       ↓
제안서 관리 (/proposals)
  └─ 테이블: 전체 제안서, 상태 필터
```

---

## 5. Design System Plan

### 원칙

- FO = Emotional + Trust (Airbnb Experiences 톤, **모바일 퍼스트**)
- PO/BO = Productivity + Data (Shopify Admin 톤, 데스크톱)
- 스타일 혼용 금지
- 모든 UI는 `packages/ui` 토큰 사용, 인라인 스타일 금지

### FO 디자인 레퍼런스 — Airbnb Experiences 재해석

Airbnb에서 가져오는 것:
1. **카드 기반 리스트** — 이미지 + 핵심 정보 + 신뢰 요소
2. **콘텐츠 중심 스크롤** — 상세 진입 시 이미지 → 정보 → 액션 순서
3. **하단 고정 CTA** — 예약/선택 액션은 항상 sticky bottom
4. **가격/정보 hierarchy** — 가격 > 핵심 스펙 > 부가 정보 순서
5. **신뢰 요소 강조** — 인증 뱃지, 병원 정보, 시술 항목 수
6. **여백 + 타이포 중심** — 깔끔하고 숨 쉬는 레이아웃

재해석 방향:
- '여행 상품' → '성형/시술 제안서'
- '예약' → '비교 및 의사결정'
- '호스트' → '병원'
- "성형 플랫폼"이 아니라 **"프리미엄 경험을 선택하는 앱"** 느낌

### FO 금지 사항

- 복잡한 테이블 UI 사용 금지 (특히 비교 화면)
- 데스크톱 중심 레이아웃 먼저 설계 금지
- 정보 과잉 UI 금지 (모바일에서 스캔 불가능한 구조)
- 작은 터치 타겟 금지 (최소 44px)
- 가로 스크롤 테이블 금지

### 토큰 (03-design-tokens.md 기준)

**FO**: 흰 배경, #FF385C accent, 12px radius, Pretendard, 16px body
**PO/BO**: #F6F6F7 배경, #008060 accent, 8px radius, Inter, 14px body

### FO 레이아웃 구조 (모바일 기준)

```
┌─────────────────────┐
│  Header (slim)      │  ← 로고 + 뒤로가기 + 알림
├─────────────────────┤
│                     │
│  Content            │  ← 스크롤 영역
│  (카드/폼/상세)      │
│                     │
├─────────────────────┤
│  Sticky Bottom CTA  │  ← 주요 액션 (thumb zone, h:56px+)
└─────────────────────┘
```

### FO 비교 화면 구조 (모바일)

```
┌─────────────────────┐
│  "2개 제안서 비교 중" │
├─────────────────────┤
│  ┌───────┐ ┌───────┐│  ← 카드 스와이프 (좌우)
│  │ 병원A │ │ 병원B ││
│  │ 350만 │ │ 280만 ││
│  │ 7일   │ │ 5일   ││
│  │ 수면  │ │ 부분  ││
│  └───────┘ └───────┘│
│  ─── 항목별 비교 ─── │  ← 아래로 스크롤
│  가격: A 350 / B 280 │
│  회복: A 7일 / B 5일 │
├─────────────────────┤
│  "이 제안서 선택"     │  ← sticky bottom
└─────────────────────┘
```

### Phase 1 필수 컴포넌트

**Primitives** (`packages/ui`):

| Component | FO | PO | BO |
|-----------|----|----|-----|
| Button (primary/secondary/ghost) | O | O | O |
| Input / Textarea | O | O | O |
| Select | O | O | O |
| Upload (사진) | O | O | — |
| Card | O | O | O |
| Badge (상태) | O | O | O |
| Modal / BottomSheet | O | O | O |
| Skeleton | O | O | O |
| Empty State | O | O | O |
| StickyBottomBar | O | — | — |

**FO Patterns** (모바일 퍼스트):

| Pattern | 용도 | 모바일 구조 |
|---------|------|------------|
| ConcernForm | 고민 등록 | 풀스크린 멀티스텝 + 하단 "다음" 고정 |
| ProposalCard | 제안서 카드 | 이미지+가격+태그 (Airbnb 카드 스타일) |
| CompareSwiper | 제안서 비교 | 카드 스와이프 + 항목별 비교 스크롤 |
| StickyBottomCTA | 주요 액션 | thumb zone 고정 (h:56px+, safe area) |

**PO Patterns**:

| Pattern | 용도 |
|---------|------|
| ConcernRow | 고민 리스트 행 (부위+예산+상태) |
| ProposalForm | 제안서 작성 폼 (시술항목 동적 추가) |
| CreditStatus | 크레딧 잔액 + 최근 사용 |
| KPIPanel | 숫자 + 라벨 카드 |

**BO Patterns**:

| Pattern | 용도 |
|---------|------|
| DataTable | 정렬/필터/페이지네이션 |
| FunnelChart | 퍼널 시각화 |
| StatusBadge | 상태별 컬러 뱃지 |
| Timeline | 고객 활동 로그 |

---

## 6. I18N Plan

### 구조

```
packages/i18n/
├── messages/
│   ├── ko.json
│   └── zh-CN.json
└── index.ts
```

### 규칙

1. 하드코딩 문자열 없음 — 모든 UI 텍스트는 키 기반
2. 직역 금지 — 중국어는 샤오홍슈 톤으로 로컬라이즈
3. FO만 다국어 — PO/BO는 ko만 (Phase 1)

### 키 네이밍 컨벤션

```json
{
  "fo.landing.hero.title": "나에게 맞는 시술, 병원이 먼저 제안합니다",
  "fo.concern.form.bodyArea.label": "고민 부위",
  "fo.concern.form.bodyArea.eye": "눈",
  "fo.proposal.card.totalPrice": "총 비용",
  "fo.proposal.compare.title": "제안서 비교",
  "po.dashboard.kpi.newConcerns": "오늘 새 고민",
  "po.proposal.form.treatmentName": "시술명"
}
```

### locale 라우팅 (FO만)

```
apps/fo/src/app/[locale]/page.tsx       → /ko, /zh-CN
apps/fo/src/app/[locale]/concerns/...
```

PO/BO는 locale prefix 없음 (ko 고정).

---

## 7. Technical Plan

### Monorepo 구조

```
hyliren/
├── apps/
│   ├── fo/                          ← Next.js (고객, 모바일 퍼스트)
│   │   ├── src/app/[locale]/
│   │   │   ├── page.tsx             ← 랜딩
│   │   │   ├── (auth)/signup/
│   │   │   ├── (auth)/login/
│   │   │   ├── concerns/new/
│   │   │   ├── concerns/[id]/
│   │   │   ├── concerns/[id]/proposals/
│   │   │   └── concerns/[id]/compare/
│   │   ├── src/components/          ← FO 전용 컴포넌트
│   │   ├── src/hooks/
│   │   ├── src/lib/
│   │   └── next.config.ts
│   │
│   ├── po/                          ← Next.js (병원, 데스크톱)
│   │   └── src/app/
│   │       ├── (auth)/login/
│   │       ├── dashboard/
│   │       ├── concerns/
│   │       ├── concerns/[id]/
│   │       ├── concerns/[id]/propose/
│   │       ├── proposals/
│   │       └── credits/
│   │
│   └── bo/                          ← Next.js (관리자, 데스크톱)
│       └── src/app/
│           ├── (auth)/login/
│           ├── dashboard/
│           ├── buyers/
│           ├── buyers/[id]/
│           ├── partners/
│           ├── proposals/
│           └── settings/
│
├── packages/
│   ├── ui/                          ← 디자인 시스템
│   │   ├── src/
│   │   │   ├── tokens/              ← CSS 변수 + Tailwind config
│   │   │   ├── primitives/          ← Button, Input, Card, Badge, ...
│   │   │   └── index.ts
│   │   ├── tailwind.config.ts
│   │   └── package.json
│   │
│   ├── shared/                      ← 도메인 타입 + 유틸
│   │   ├── src/
│   │   │   ├── types/               ← schema 기반 TS 타입
│   │   │   ├── constants/           ← body_area, enums
│   │   │   ├── domain/              ← 상태 전이 로직
│   │   │   ├── mock/                ← mock data (실제 시나리오)
│   │   │   └── utils/
│   │   └── package.json
│   │
│   └── i18n/
│       ├── messages/ko.json
│       ├── messages/zh-CN.json
│       └── package.json
│
├── turbo.json
├── package.json
├── pnpm-workspace.yaml
└── PHASE1_HARNESS.md                ← 이 문서
```

### packages/shared/src/types — Schema 기반 타입

```typescript
// 모든 타입은 002_final.sql 기준으로 생성
// ENUM은 string union으로 매핑

type UserRole = 'buyer' | 'referrer';
type MemberRole = 'partner' | 'admin';
type ConcernStatus = 'draft' | 'submitted' | 'proposal_received' | 'comparing' | ...;
type ProposalStatus = 'draft' | 'sent' | 'viewed' | 'shortlisted' | 'selected' | 'rejected';
type AnesthesiaType = 'local' | 'sedation' | 'general';
type OrderType = 'report' | 'service';

// Order Discriminated Union (Rule 3)
type ReportOrder = { type: 'report'; details: ReportOrderDetails };
type ServiceOrder = { type: 'service'; details: ServiceOrderDetails };
type Order = ReportOrder | ServiceOrder;
```

### packages/shared/src/constants — body_area 정규화

```typescript
export const BODY_AREAS = ['눈', '코', '리프팅', '피부', '다이어트', '기타'] as const;
export type BodyArea = typeof BODY_AREAS[number];
```

FO/PO/BO/Article 전부 이 상수만 사용.

### Mock Data 전략

`packages/shared/src/mock/` — 빈 데이터 금지, 실제 시나리오 기반:

- 고객 3명 (다른 부위, 다른 예산)
- 병원 5개 (다른 전문 분야)
- 고민 5건 (다른 상태)
- 제안서 12건 (다른 상태, 버전 포함)
- 각 고민에 최소 2~3개 제안서

### State Management

| Scope | Tool | 예시 |
|-------|------|------|
| Server | React Query | 제안서 리스트, 고민 상세 |
| Client | Zustand | 비교 선택 상태, 모달 |
| Form | React Hook Form + Zod | 고민 등록, 제안서 작성 |
| URL | searchParams | 필터, 페이지네이션 |

### Event Tracking (Day 1)

`packages/shared/src/events/tracker.ts`

Phase 1 필수 이벤트:
```
signup_completed
concern_submitted
proposal_sent
proposal_viewed
proposal_shortlisted
```

metadata 규약: `{ source: 'fo'|'po'|'bo', locale: 'ko'|'zh-CN' }`

---

## 8. Build Order

### Step 0: Monorepo Scaffold (Day 1)

```
[ ] pnpm init + pnpm-workspace.yaml
[ ] turbo.json (dev, build, lint)
[ ] apps/fo, apps/po, apps/bo — Next.js boilerplate
[ ] packages/ui, packages/shared, packages/i18n — 빈 패키지
[ ] 3앱 동시 실행 확인 (pnpm dev)
```

**완료 기준**: `pnpm dev` 로 3개 앱 localhost:3000/3001/3002 접속 가능

### Step 1: Shared Foundation (Day 2)

```
[ ] packages/shared: TS 타입 (schema 기반)
[ ] packages/shared: ENUM constants (body_area, status 등)
[ ] packages/shared: 상태 전이 함수 (concern, proposal)
[ ] packages/shared: Zod validation schemas
[ ] packages/shared: mock data (3고객, 5병원, 5고민, 12제안서)
[ ] packages/shared: event tracker 구조
```

**완료 기준**: 타입 import 시 3앱에서 에러 없음

### Step 2: Design System (Day 3)

```
[ ] packages/ui: FO 토큰 (CSS 변수)
[ ] packages/ui: PO/BO 토큰
[ ] packages/ui: Button (primary/secondary/ghost)
[ ] packages/ui: Input, Textarea, Select
[ ] packages/ui: Card
[ ] packages/ui: Badge (상태별)
[ ] packages/ui: Modal
[ ] packages/ui: Upload (사진)
[ ] packages/ui: Skeleton, Empty State
```

**완료 기준**: FO에서 import한 Button과 PO에서 import한 Button이 다른 톤으로 렌더링

### Step 3: FO Layout + Landing (Day 4)

```
[ ] FO 레이아웃 (Header + Navigation + Footer)
[ ] i18n 연결 (next-intl, /ko, /zh-CN)
[ ] 랜딩 페이지 (CTA → 고민 등록)
[ ] 가입/로그인 (mock — 이름+phone/email만)
```

### Step 4: FO 고민 등록 (Day 5-6)

```
[ ] 고민 등록 멀티스텝 폼
    [ ] Step 1: 부위 선택
    [ ] Step 2: 사진 업로드
    [ ] Step 3: 텍스트 + 예산 + 시기 + 여권
[ ] 고민 등록 완료 (대기 화면)
[ ] Zod validation
[ ] concern.status = 'submitted' 전이
```

### Step 5: PO 핵심 플로우 (Day 7-9)

```
[ ] PO 레이아웃 (Sidebar + Header)
[ ] 대시보드 (KPI: 새 고민, 제안서, 크레딧)
[ ] 고민 리스트 (필터: 부위/예산/시기)
[ ] 고민 상세 (사진 + 조건)
[ ] 제안서 작성 폼 (시술항목 동적 추가 + 구조화 필드)
[ ] 제안서 발송 (크레딧 차감 mock)
[ ] 발송 내역 (상태 추적)
```

### Step 6: FO 제안서 확인 + 비교 (Day 10-11)

```
[ ] 제안서 리스트 (카드: 병원명+가격+회복+마취)
[ ] 제안서 상세 (항목별 내역 + 이미지)
[ ] 제안서 비교 (2~3개 나란히, 구조화 필드 비교)
[ ] proposal.status 자동 전이 (viewed, shortlisted)
[ ] concern.status 자동 전이 (proposal_received, comparing)
```

### Step 7: BO 핵심 플로우 (Day 12-13)

```
[ ] BO 레이아웃 (Sidebar + Header)
[ ] 통합 대시보드 (퍼널 차트 + KPI)
[ ] 고객 관리 (DataTable + 상세 + 타임라인)
[ ] 병원 관리 (DataTable + 크레딧 현황)
[ ] 제안서 관리 (DataTable + 상태 필터)
```

### Step 8: Polish (Day 14)

```
[ ] i18n 메시지 완성 (ko 전체, zh-CN FO 전체)
[ ] 반응형 확인 (FO: 모바일 퍼스트, PO/BO: 데스크톱)
[ ] 상태 전이 엣지 케이스 테스트
[ ] mock data 시나리오 검증
[ ] 하네스 문서 업데이트
```

---

## Guardrails Checklist (위반 시 즉시 수정)

### 도메인
- [ ] User/Member 테이블 혼용 없음
- [ ] Concern→Proposal 외 매칭 경로 없음
- [ ] Proposal 핵심 필드 구조화 유지 (free text는 consultation_note만)
- [ ] total_price가 권위 값 (items는 설명용)
- [ ] 모든 가격 KRW INT (만원 or 원)
- [ ] concern.status가 흐름 결정 (UI if/else 금지)
- [ ] 상태 전이는 shared/domain/transitions.ts에서만

### 코드
- [ ] 인라인 스타일 없음 (토큰만)
- [ ] 하드코딩 문자열 없음 (i18n 키만)
- [ ] mock data에 빈 데이터 없음
- [ ] 임시 구조 없음 ("나중에 리팩토링" 금지)

### FO 디자인 (모바일 퍼스트)
- [ ] FO ≠ PO/BO 디자인 혼용 없음
- [ ] FO 모든 화면이 375px 기준으로 먼저 동작
- [ ] 주요 CTA가 모바일 하단 thumb zone에 고정
- [ ] 비교 화면에 테이블 UI 사용 안 함 (카드 스와이프)
- [ ] 한 화면에 스캔 불가능한 정보 밀도 없음
- [ ] 터치 타겟 최소 44px
- [ ] "성형 플랫폼" 느낌 아닌 "프리미엄 선택 앱" 느낌

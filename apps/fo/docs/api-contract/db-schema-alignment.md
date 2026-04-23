# DB Schema Alignment Report

**작성일**: 2026-04-23
**기준 DB 스키마**: `docs/schema/final.sql` (v2.2, PostgreSQL 16+)
**검수 대상**: FO 의 `packages/shared/src/constants/enums.ts`, `packages/shared/src/types/**`, FO mock route handlers
**목적**: yj.jung 의 DB 스키마에 FO 프로토타입이 얼마나 정렬되어 있는지 감사하고, 본개발 진입 시 FO 측에서 맞춰야 할 작업을 도메인 단위로 정리.

---

## 🟨 요약

| 분류 | 건수 | 의미 |
|---|---|---|
| ✅ 일치 | 8개 도메인 | 본개발 전환 시 FO 변경 최소 |
| 🔴 Critical 불일치 | **6건** | 본개발 시 런타임 에러·데이터 손실 가능 |
| 🟡 Warning 불일치 | **9건** | 본개발 전 정리 필요, 지금도 헷갈림 유발 |
| 🔵 Info (누락/예정) | **5건** | Wave 2·3 에서 자연스럽게 해결 |

**종합 평가**: 프로토타입 전체 구조(엔티티, 관계, soft delete, ULID 전제)는 **DB 설계와 잘 정렬**. 그러나 **enum 값·파생 상태 명명**에서 FO 가 일방적으로 확장한 부분이 많아 본개발 전에 **합의 회의 필수**.

---

## 1. Enum 불일치 매트릭스

| Enum | FO (`enums.ts`) | DB (final.sql) | 심각도 |
|---|---|---|---|
| `USER_ROLES` | `buyer, referrer` | `buyer, admin` | 🔴 |
| `MEMBER_ROLES` | `partner, admin` | `partner, admin` | ✅ |
| `CONCERN_STATUSES` | 9개 (draft, submitted, **proposal_received, comparing, report_purchased, hospital_selected, service_purchased, completed, cancelled**) | 3개 (draft, submitted, closed) | 🔴 |
| `CONCERN_SOURCES` | `organic, referral, article, ad, direct` | `organic, referral, campaign` | 🔴 |
| `PROPOSAL_STATUSES` | `draft, sent, viewed, shortlisted, selected, rejected` | `draft, sent, accepted, rejected, expired` | 🔴 |
| `ANESTHESIA_TYPES` | `local, sedation, general` | `local, sedation, general` | ✅ |
| `ORDER_TYPES` | `report, service` | `report, service` | ✅ |
| `ORDER_STATUSES` | 7개 (pending, paid, processing, delivered, completed, cancelled, refunded) | 4개 (pending, paid, cancelled, refunded) | 🟡 |
| `REPORT_TYPES` | `standard, premium` | `standard, premium` | ✅ |
| `REPORT_SCOPES` | **(없음)** | `single, multi` | 🟡 |
| `SERVICE_TYPES` | 8개 (schedule, interpreter, pickup, hotel, butler, recovery_care, tour, package) | 4개 (translation, escort, accommodation, transport) | 🔴 |
| `SUBSCRIPTION_PLANS` | `free, basic, premium` | `basic, pro, enterprise` | 🔴 |
| `SUBSCRIPTION_STATUSES` | `active, cancelled, expired` | `active, expired, cancelled` | ✅ (순서만 다름) |
| `CREDIT_REASONS` | `purchase, proposal_sent, refund, bonus` | `purchase, refund, proposal_send, subscription_grant, admin_adjust` | 🔴 |
| `ARTICLE_STATUSES` | `draft, published, archived` | `draft, published, archived` | ✅ |
| `ARTICLE_CATEGORIES` | `procedure, case_study, pricing, risk, skincare, trend` | `guide, review, news, tip` | 🔴 |
| `ARTICLE_INTENTS` | `awareness, consideration, conversion` | `education, promotion, seo` | 🔴 |
| `EVENT_ACTOR_TYPES` | `user, member, system` | `user, member, system` | ✅ |
| `EVENT_TARGET_TYPES` | `concern, proposal, order, article, user, member` | `concern, proposal, order, member` | 🟡 |
| `PAYOUT_STATUSES` | `pending, approved, paid, cancelled` | `pending, approved, paid, rejected` | 🔴 |
| `PAYOUT_TRIGGERS` | `signup, concern_submitted` | `signup, first_order, subscription` | 🔴 |
| `BODY_AREAS` | 6개 enum | VARCHAR(50), JSONB 자유 | ✅ (DB 가 관대) |
| `LOCALES` | `ko, zh-CN` | VARCHAR(10), 기본 zh-CN | ✅ |

---

## 2. 🔴 Critical 이슈 상세

### C1. Event `actor_type` 에 `partner` / `admin` 전송 시 insert 실패

**현재 FO 코드**: [packages/shared/src/events/tracker.ts](../../../../packages/shared/src/events/tracker.ts) 의 `TrackEvent.actorType` 가 `'user' | 'partner' | 'admin' | 'system'`.

**DB 제약**: `event_actor_type AS ENUM ('user', 'member', 'system')`.

**위험**: FO/PO 컴포넌트가 `actorType: 'partner'` 로 track 호출하면 **DB insert 에러 발생**. 프로토타입 mock 은 아무 문자열이나 수용해서 드러나지 않고 있음.

**현재 오용 예** (grep):
- PO/BO 앱의 `track({ actorType: 'partner', ... })` 호출

**수정**:
```diff
- actorType: 'user' | 'partner' | 'admin' | 'system';
+ actorType: 'user' | 'member' | 'system';  // DB 와 일치
```

파트너·관리자 행위자는 **DB 스키마상 모두 `member`** 로 통합됨 (members 테이블이 partner + admin role 모두 보유). FO 의 TrackEvent 타입과 모든 track() 호출처 수정 필요.

---

### C2. `CONCERN_STATUSES` 파생 상태 9개를 서버에 보내면 실패

**현재 FO**: 9개 상태 (draft, submitted, proposal_received, comparing, report_purchased, hospital_selected, service_purchased, completed, cancelled).

**DB**: 3개 (`draft, submitted, closed`).

**현재 매개 방식**: `apps/fo/src/lib/api/concern/mapper.ts` 의 `mapStatus()` 가 wire 의 3상태 + proposalCount + selectedHospital 조합으로 UI 상태 9개를 **파생**. 읽기 경로는 정합.

**위험 시나리오**:
- FO 가 `PATCH /concerns/:id { status: 'comparing' }` 보내는 곳이 있으면 DB enum 위반
- `CONCERN_STATUSES` 를 shared enum 으로 두면서 "UI용 vs DB용" 구분 없음 → 신규 개발자가 혼동

**수정**:
- `packages/shared/src/constants/enums.ts` 에 두 종류 분리:
  ```ts
  // DB 저장 상태 (서버에 보낼 수 있는 값)
  export const CONCERN_DB_STATUSES = ['draft', 'submitted', 'closed'] as const;
  // FO 파생 상태 (UI 전용)
  export const CONCERN_UI_STATUSES = [ /* 9개 */ ] as const;
  ```
- `createConcernSchema` / `updateConcernSchema` 는 `CONCERN_DB_STATUSES` 만 accept
- mapper.ts 의 타입 시그니처도 UI 타입 반환으로 명시

---

### C3. `CONCERN_SOURCES` 값 불일치 — Real API 호출 시 400

**FO**: `organic, referral, article, ad, direct` (5개)
**DB**: `organic, referral, campaign` (3개)

**위험**: FO `StepConfirm` 에서 `source: 'organic'` 보내는 건 OK. 하지만 마케팅 실험으로 `source: 'ad'` 나 `source: 'article'` 보내면 **DB 400 "invalid input value for enum concern_source"**.

**제안 매핑**:
| FO 기존 값 | DB 대응 |
|---|---|
| `organic` | `organic` |
| `referral` | `referral` |
| `article` | → `campaign` (정보성 콘텐츠 → 캠페인) |
| `ad` | → `campaign` |
| `direct` | → `organic` (유입 구분 안 되면 organic) |

**또는 DB enum 을 FO 에 맞게 확장**. yj.jung 과 합의 필요.

---

### C4. `PROPOSAL_STATUSES` 의미 충돌 — `selected` vs `accepted`, `viewed` vs `expired`

**FO**: `draft, sent, viewed, shortlisted, selected, rejected`
**DB**: `draft, sent, accepted, rejected, expired`

**의미 비교**:
| FO | DB | 해석 |
|---|---|---|
| `draft` | `draft` | ✅ 동일 |
| `sent` | `sent` | ✅ 동일 |
| `viewed` | — | FO 만 있음 (`viewed_at` 타임스탬프와 무관) |
| `shortlisted` | — | FO 만 |
| `selected` | `accepted` | 🔴 다른 이름, 같은 의미? |
| `rejected` | `rejected` | ✅ |
| — | `expired` | DB 만 |

**현재 mapper.ts 처리**:
```ts
wire.status === 'accepted' || wire.status === 'selected' → UI 'accepted'
```
즉 FO 코드가 양쪽 수용 중. 하지만 `shortlisted`, `viewed`, `expired` 3개는 매핑 규칙 부재.

**제안 통일안**:
- DB 를 정본으로 삼아 FO 도 `accepted, expired` 채택
- `viewed` 상태는 실제로 별도 컬럼(`viewed_at`) 로 관리 중이므로 status enum 에서 제외
- `shortlisted` 는 **사용자 즐겨찾기 기능** 으로 별도 `user_proposal_favorites` 테이블 도입 (C5 참조)

---

### C5. `isFavorite` / shortlisted — DB 테이블 누락

**현재 FO**: `ProposalListItemWire.isFavorite: boolean`. mock 에서 `false` 고정.

**DB**: 즐겨찾기 관련 테이블·컬럼 없음.

**위험**: 본개발 시 FO 가 "즐겨찾기" 기능 제공하려면 DB 에 `user_proposal_favorites (user_id, proposal_id, created_at, UNIQUE(user_id, proposal_id))` 테이블 필요.

**권장**: Wave 2 에서 도입하거나, Wave 1 에서 FO 의 `isFavorite` 필드 제거. yj.jung 결정 필요.

---

### C6. `concern.raw_narrative` / `feedback_turns` 전달 누락

**DB 스키마**:
```sql
CREATE TABLE concerns (
  ...
  raw_narrative    TEXT,          -- 고객 최초 입력 원문
  feedback_turns   JSONB NOT NULL DEFAULT '[]',  -- AI 상담 대화 히스토리
  ai_summary       JSONB,         -- AI 분석 구조화 요약
  ...
);
```

**현재 FO**: 
- [apps/fo/src/components/consult/StepConfirm.tsx:82](../../../src/components/consult/StepConfirm.tsx) 의 `body` 에 **`rawNarrative`, `feedbackTurns`, `aiSummary` 모두 포함 안 됨**
- `narrativeInput`(=원문) 을 `description` 으로만 전달
- `feedbackTurns` 는 `useConcernFlowStore` 에 local 보관 후 submit 시점에 **버려짐**
- `analysisResult` 도 store 에만 유지 → concern 에 저장 안 됨

**위험**: 본개발 시 이 3개 컬럼이 **빈 값**. AI 재분석·BO 감사·마케팅 분석 모두 불가능.

**수정**: [concern POST body](concern/README.md) 에 3개 필드 추가:

```ts
// apps/fo/src/lib/api/concern/types.ts
export interface CreateConcernBody {
  description: string;        // 정제된 본문 (= narrative, 또는 AI summary text)
  rawNarrative?: string;      // 🆕 고객 최초 입력 원문
  feedbackTurns?: Array<{     // 🆕 AI 상담 턴 히스토리
    role: 'user' | 'ai';
    message: string;
  }>;
  aiSummary?: Record<string, unknown>;  // 🆕 analysisResult 전체 JSON
  // ... 기존 필드들
}
```

그리고 `StepConfirm.handleConfirm` 에서:
```ts
const body = {
  description: analysisResult.summary.text,  // AI 정제본
  rawNarrative: narrativeInput,              // 🆕 원문
  feedbackTurns: feedbackTurns,              // 🆕 대화 이력
  aiSummary: analysisResult,                 // 🆕 분석 결과 전체
  ...
};
```

Mock 의 `createConcernSchema` 도 이 3개 필드 추가 (optional, strict 허용).

---

## 3. 🟡 Warning 이슈 상세

### W1. `ORDER_STATUSES` 가 FO 에서 초과 (processing/delivered/completed 3개)

**DB**: 4개 (pending, paid, cancelled, refunded)
**FO**: 7개

**위험**: FO 가 `status: 'processing'` 저장 시도하면 400. 현재 사용처는 없는 것으로 추정되지만 Wave 2 결제 연동 시 실제로 발생 가능.

**수정**: FO enum 을 DB 4개로 축소. 중간 상태가 필요하면 `paid_at`, `delivered_at`, `processed_at` 같은 **타임스탬프 컬럼** 으로 표현 (이미 DB 가 이 패턴).

### W2. `REPORT_SCOPES` (single/multi) 누락

**DB**: `report_scope AS ENUM ('single', 'multi')` — 복수 제안서 비교 리포트 지원.
**FO**: enum 없음, `targetProposalId: string | null` 만 있음.

**현재 FO 의 report 구조**:
```ts
interface ReportOrderDetails {
  targetProposalId: string | null;  // single 만 전제
  // targetProposalIds: string[] 필드 없음
}
```

**영향**: multi 리포트 구매 UI 설계 시 필드 추가 필요. 지금은 Wave 2 의제.

### W3. `SERVICE_TYPES` 명명·개수 상이

**FO**: `schedule, interpreter, pickup, hotel, butler, recovery_care, tour, package`
**DB**: `translation, escort, accommodation, transport`

**정리 제안**:
| FO | DB 가능 매핑 | 처리 |
|---|---|---|
| `schedule` | — | 🟡 DB 에 추가 or FO 에서 제거 |
| `interpreter` | `translation` | 이름 통일 |
| `pickup` | `transport` | 포함 |
| `hotel` | `accommodation` | 이름 통일 |
| `butler` | `escort` | 유사 의미 |
| `recovery_care` | — | 🟡 별도 분류 논의 |
| `tour` | — | 🟡 관광 서비스 범주 추가 |
| `package` | (`service_package_items` 로 표현) | 테이블 레벨 |

**결정 필요**: Wave 3 에서 서비스 유형 확정. 지금은 FO MOCK 에서만 쓰이므로 우선순위 낮음.

### W4. `SUBSCRIPTION_PLANS` 불일치 (free/basic/premium vs basic/pro/enterprise)

PO 영역이지만 FO shared enum 에서 노출됨. **PO 팀 협의 항목**.

### W5. `CREDIT_REASONS` 불일치

| FO | DB |
|---|---|
| `purchase` | `purchase` ✅ |
| `proposal_sent` | `proposal_send` 🔴 (이름만 다름) |
| `refund` | `refund` ✅ |
| `bonus` | — 🟡 |
| — | `subscription_grant` |
| — | `admin_adjust` |

**수정**: `proposal_sent → proposal_send` 이름 통일. FO enum 에 `subscription_grant`, `admin_adjust` 추가. `bonus` 제거 또는 DB 에 추가.

### W6. `ARTICLE_CATEGORIES` / `ARTICLE_INTENTS` 완전 불일치

**Category** (FO): `procedure, case_study, pricing, risk, skincare, trend`
**Category** (DB): `guide, review, news, tip`

**Intent** (FO): `awareness, consideration, conversion` (마케팅 깔때기 용어)
**Intent** (DB): `education, promotion, seo` (콘텐츠 목적 용어)

**상황**: FO `lib/articles-data.ts` 가 정적 파일이라 **현재 혼란 없음**. 그러나 Wave 3 CMS 연동 시 둘 중 하나 채택 필수.

**제안**: **DB 안을 채택** (의미가 더 명확). FO static data 재분류.

### W7. `PAYOUT_TRIGGERS` 불일치

**FO**: `signup, concern_submitted` (2개)
**DB**: `signup, first_order, subscription` (3개)

**차이**:
- FO 의 `concern_submitted` 트리거는 DB 에 없음 — **리퍼럴 보상이 "고민 등록" 시에 발동되는지**가 미결정
- DB 의 `subscription` 은 PO 측 구독 관련

**제안**: 사업 정책 결정 선행. FO 의 `concern_submitted` 는 지금은 사용처 없어 제거 가능.

### W8. `EVENT_TARGET_TYPES` 에 FO 가 `article, user` 추가

**DB enum**: `concern, proposal, order, member` (4개)
**FO**: 위 + `article, user` (6개)

**위험**: FO 의 `track({ targetType: 'article', ... })` 호출 시 DB insert 실패.

**수정 옵션**:
- (a) DB enum 확장 (`article`, `user` 추가)
- (b) FO 에서 `article`, `user` 대상 이벤트는 `targetType: null` + `metadata.articleId`, `metadata.userId` 로 우회

**권장**: (a). article 은 viewCount, ctaClick 등 집계 쿼리가 잦으므로 target_type 기반 인덱싱 이점 큼.

### W9. `USER_ROLES` 의 `referrer` vs DB 의 `admin`

**FO**: `buyer, referrer`
**DB**: `buyer, admin`

**해석**:
- DB 의 users 테이블은 **고객** 전용 — admin 은 내부 운영자도 같은 테이블에 두겠다는 설계
- FO 의 `referrer` 는 추천인 역할을 별도 role 로 표현하려 한 것으로 추정 — 그러나 referrer 는 **role** 이 아니라 **behavior** (buyer 가 추천 활동하면 referrer 라고 부르는 것). 별도 role 로 분리 불필요
- `members` 테이블이 PO/admin 관리자를 맡으므로 users 의 `admin` 은 고객관리팀 admin

**수정**: FO `USER_ROLES` 를 `buyer, admin` 로 수정.

---

## 4. 🔵 Info (알고 있고 나중 처리)

- **ID 생성**: FO 가 `c-${Date.now()}` 같은 ID 생성 중. 본개발 시 서버가 ULID VARCHAR(28) 로 발급 → FO 는 생성 책임 제거
- **ID 포맷**: ULID 는 정렬 가능 + URL-safe. `c-`, `p-` 같은 프리픽스는 DB 에 없음 — FO 의 UI 표시엔 영향 없으나 실제 저장 ID 는 prefix 없음
- **`partner_profiles.specialties` 타입**: FO `BodyArea[]` (enum) vs DB `JSONB` (자유). DB 가 관대하므로 런타임 문제 없음 — 다만 FO mapper 가 unknown 값 만났을 때 `'기타'` 로 정규화하는 패턴 이미 적용 중
- **`orders.concern_id NOT NULL`**: DB 는 모든 주문이 concern 에 연결 강제. 리포트는 맞지만 **service 주문이 특정 concern 없이 발생 가능한지** 결정 필요 (예: 단독 통역 구매)
- **`buyer_profiles.country` default 'CN'**: 중국 타겟 확정. FO 의 `Locale` 기본값도 `zh-CN` 으로 맞추는 게 일관

---

## 5. 테이블별 필드 매핑 검수

### 5.1 ✅ 완전 일치하는 테이블
- `members`
- `partner_profiles`
- `concern_photos`
- `proposal_items`
- `proposal_images` (FO 타입 존재하나 mock 에 데이터 없음)
- `hospital_selections` (FO 는 읽기만, 쓰기 없음)
- `service_package_items` (미사용)

### 5.2 🟡 부분 일치하는 테이블

| 테이블 | FO 누락·불일치 필드 |
|---|---|
| `users` | `role` enum 불일치 (C/W9) |
| `buyer_profiles` | FO 는 존재. country 값 `'CN'` 기본 대응 필요 |
| `concerns` | `raw_narrative`, `feedback_turns` 전달 누락 (C6) |
| `proposals` | `hospital_name`, `hospital_logo` FO wire 에 embed 필요 (이미 mock 에서 join 제공 중) |
| `orders` | FO 의 `status` enum 초과 (W1) |
| `report_order_details` | `scope`, `target_proposal_ids` 누락 (W2) |
| `events` | `actor_type`, `target_type` enum 불일치 (C1, W8) |
| `articles` | category/intent 완전 불일치 (W6). 정적 데이터 단계라 지금 영향 없음 |

### 5.3 🔵 FO 가 접근하지 않는 테이블 (PO 영역)
- `subscriptions`
- `credit_balances`
- `credit_transactions`
- `referral_payouts`

---

## 6. Wave 1 FO 수정 작업 목록

**본개발 진입 전 선제 조치** — 이후 real API 로 전환 시 회귀 최소화.

### 🔴 필수 (C1~C6)

- [ ] `TrackEvent.actorType` 을 `'user' | 'member' | 'system'` 로 축소. 모든 `track()` 호출처에서 `'partner'|'admin'` → `'member'` 로 교체
- [ ] `EVENT_TARGET_TYPES` 확장 합의 후 반영 (FO 또는 DB 중 한쪽)
- [ ] `CONCERN_STATUSES` 를 `DB_STATUSES` + `UI_STATUSES` 로 분리. 모든 스키마·zod 에서 DB_STATUSES 만 허용
- [ ] `CONCERN_SOURCES` 합의 후 FO 값 축소 또는 DB 확장
- [ ] `PROPOSAL_STATUSES` 의 `viewed / shortlisted / selected` 를 DB `accepted / expired` 에 맞게 재매핑
- [ ] `ProposalListItemWire.isFavorite` 제거 또는 user_proposal_favorites 테이블 설계 협의
- [ ] **`CreateConcernBody` 에 `rawNarrative`, `feedbackTurns`, `aiSummary` 필드 추가** + StepConfirm 의 submit body 보강

### 🟡 권장 (W1~W9)

- [ ] `ORDER_STATUSES` 를 DB 4개로 축소
- [ ] `USER_ROLES` 를 `buyer, admin` 로 수정 (referrer 제거)
- [ ] `CREDIT_REASONS.proposal_sent` → `proposal_send` 로 개명
- [ ] `PAYOUT_STATUSES.cancelled` → `rejected` 로 통일
- [ ] `PAYOUT_TRIGGERS.concern_submitted` 제거 또는 DB 에 추가 결정
- [ ] `SUBSCRIPTION_PLANS` PO 팀 협의
- [ ] `SERVICE_TYPES` Wave 3 확정 전까지 유지 가능 (현재 사용처 없음)
- [ ] `ARTICLE_CATEGORIES` / `INTENTS` Wave 3 CMS 연동 시 DB 값으로 통일

### 🔵 Wave 2·3 처리
- [ ] `REPORT_SCOPES` 도입 (multi 리포트 UI 설계 시)
- [ ] ULID 전환 — 서버가 생성하는 ID 수용하도록 FO 의 optimistic ID 로직 제거

---

## 7. api-contract 문서 업데이트 필요 항목

Wave 1 합의 확정되면 다음 문서들 업데이트 필요:

- [auth/README.md](auth/README.md) — `User.role` 값 수정
- [concern/README.md](concern/README.md) — `CreateConcernBody` 에 rawNarrative/feedbackTurns/aiSummary 추가, sources 값 정리
- [proposal/README.md](proposal/README.md) — status enum, isFavorite 처리 확정
- [order-payment/README.md](order-payment/README.md) — order status 축소, report scope 필드 추가
- [event/README.md](event/README.md) — actor_type / target_type enum 동기화
- [article/README.md](article/README.md) — category/intent 값 DB 기준으로 교체

---

## 8. yj.jung 과 즉시 합의 필요한 10가지

이 리스트는 [open-questions.md](open-questions.md) 에 **신규 섹션**으로 추가 예정:

1. **Concern source 통합안** — FO 5개 vs DB 3개 중 어느 쪽으로 맞출지
2. **Proposal status 의미** — `selected` vs `accepted`, `viewed_at` 컬럼과 `viewed` status 의 관계
3. **Event actor/target enum 확장** — DB 를 확장할지 FO 를 축소할지
4. **`isFavorite` 구현 방식** — user_proposal_favorites 테이블 신설 vs 기능 제거
5. **`rawNarrative` / `feedbackTurns` / `aiSummary` 저장 확정** — FO 에서 submit 시 함께 전송
6. **Order `concern_id NOT NULL`** — 서비스 주문이 특정 concern 없이 가능한지
7. **Service types 재정의** — FO 8개를 DB 4개에 맞출지, DB 확장할지
8. **Subscription plan 용어** — free/basic/premium vs basic/pro/enterprise
9. **Article category/intent** — CMS 도입 시점에 확정
10. **Referral payout trigger** — `concern_submitted` 도 트리거인지 (제품 PM 결정)

---

## 9. 종합 의견

**전체 구조 일치율**: 약 **70%**. 핵심 엔티티·관계·soft delete·FK 패턴은 DB 설계와 FO 타입이 자연스럽게 정렬됨. 단 **enum 값 불일치가 많아** 본개발 진입 시 회귀 에러 가능성 큼.

**가장 시급한 3건**:
1. **C6 concern 의 rawNarrative/feedbackTurns/aiSummary 저장 경로 확보** — DB 에 컬럼은 있지만 FO 가 전달 안 함. 본개발 전환 시 **데이터 소실** 직결
2. **C1 event actor_type 수정** — PO/BO 의 track() 호출이 대량으로 실패할 예정
3. **C3·C4 concern source / proposal status 의미 합의** — 사업 로직에 직접 영향

**Wave 0 작업 (본개발 킥오프 전)**: 이 리포트를 yj.jung 과 공유 → 10개 합의 항목 확정 → FO 의 `packages/shared/src/constants/enums.ts` 를 DB 정본 기준으로 정리. 예상 공수 **1~2일**.

이 작업을 **건너뛰면** 본개발 첫 주 전체가 "enum 왜 안 맞지?" 디버깅으로 소모될 가능성 높음. 토스페이먼츠 합류 초기 비슷한 함정 경험 있음 (클라이언트·서버 enum 대치로 3일 날림).

---

## 10. 업데이트 규칙

- yj.jung 과 합의가 이뤄질 때마다 해당 항목에 ✅ 표시 + 결정 내용 + 결정 일자 기록
- 합의 후 FO 코드 수정이 완료되면 체크박스 체크
- 새로운 DB 스키마 마이그레이션이 추가되면 이 리포트 재검수 (schema version 업데이트 기록)

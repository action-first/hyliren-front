# Schema Design

> 이 스키마는 "나중에 안 뜯는다"를 목표로 설계되었다.
> 5개 core entity + extension 패턴.

---

## 가드레일

1. Core entity는 5개만: User, Member, Concern, Proposal, Order
2. User(수요) / Member(공급) 완전 분리
3. Concern→Proposal이 유일한 매칭 채널 (1 Concern : N Proposals, 1 Proposal : 1 Concern)
4. Proposal은 구조화된 스키마 (자유 텍스트는 보조 필드만)
5. Proposal은 버전 관리됨 (수정 = 새 버전, 덮어쓰기 금지)
6. 모든 구매는 Order entity로 (임시 결제 로직 금지)
7. Order는 반드시 concern_id를 가짐 (매출 ↔ 퍼널 추적)
8. 상태가 흐름을 결정 (UI 로직 금지)
9. 이벤트 트래킹 구조 내장
10. Article은 first-class domain

---

## 관계 규칙 (절대 위반 금지)

```
1 User       : N Concerns
1 Concern    : N Proposals      (concern_id NOT NULL)
1 Member     : N Proposals
1 Proposal   : N Versions       (version + is_active로 관리)
1 Concern    : N Orders          (concern_id NOT NULL on orders)
1 User       : N Orders
```

Concern ↔ Proposal이 매칭의 backbone이다.
이 관계가 흔들리면 전체 구조가 붕괴한다.

---

## 1. User (수요측)

```sql
CREATE TABLE users (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role            TEXT NOT NULL CHECK (role IN ('buyer', 'referrer')),
  email           TEXT UNIQUE,
  phone           TEXT,
  password_hash   TEXT,
  name            TEXT NOT NULL,
  locale          TEXT NOT NULL DEFAULT 'ko' CHECK (locale IN ('ko', 'zh-CN')),
  avatar_url      TEXT,
  referral_code   TEXT UNIQUE,
  referred_by     UUID REFERENCES users(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE buyer_profiles (
  user_id         UUID PRIMARY KEY REFERENCES users(id),
  birth_year      INT,
  gender          TEXT CHECK (gender IN ('female', 'male', 'other')),
  country         TEXT DEFAULT 'CN',
  city            TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

## 2. Member (공급측)

```sql
CREATE TABLE members (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role            TEXT NOT NULL CHECK (role IN ('partner', 'admin')),
  email           TEXT UNIQUE NOT NULL,
  password_hash   TEXT,
  name            TEXT NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE partner_profiles (
  member_id       UUID PRIMARY KEY REFERENCES members(id),
  hospital_name   TEXT NOT NULL,
  hospital_name_zh TEXT,
  description     TEXT,
  description_zh  TEXT,
  address         TEXT,
  phone           TEXT,
  website         TEXT,
  logo_url        TEXT,
  cover_image_url TEXT,
  specialties     TEXT[] DEFAULT '{}',
  verified        BOOLEAN DEFAULT FALSE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE credit_balances (
  member_id       UUID PRIMARY KEY REFERENCES members(id),
  balance         INT NOT NULL DEFAULT 0 CHECK (balance >= 0),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE credit_transactions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id       UUID NOT NULL REFERENCES members(id),
  amount          INT NOT NULL,
  reason          TEXT NOT NULL CHECK (reason IN ('purchase', 'proposal_sent', 'refund', 'bonus')),
  reference_id    UUID,
  balance_after   INT NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE subscriptions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id       UUID NOT NULL REFERENCES members(id),
  plan            TEXT NOT NULL CHECK (plan IN ('free', 'basic', 'premium')),
  status          TEXT NOT NULL CHECK (status IN ('active', 'cancelled', 'expired')),
  started_at      TIMESTAMPTZ NOT NULL,
  expires_at      TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

## 3. Concern (고민 — 매칭의 입력)

```sql
CREATE TABLE concerns (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id),
  status          TEXT NOT NULL DEFAULT 'draft' CHECK (status IN (
    'draft',
    'submitted',
    'proposal_received',
    'comparing',
    'report_purchased',
    'hospital_selected',
    'service_purchased',
    'completed',
    'cancelled'
  )),
  body_area       TEXT NOT NULL,
  body_area_detail TEXT,
  description     TEXT NOT NULL,
  budget_min      INT,
  budget_max      INT,
  visit_date_from DATE,
  visit_date_to   DATE,
  has_passport    BOOLEAN DEFAULT FALSE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE concern_photos (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  concern_id      UUID NOT NULL REFERENCES concerns(id) ON DELETE CASCADE,
  url             TEXT NOT NULL,
  sort_order      INT NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

## 4. Proposal (제안서 — 매칭의 출력)

### 버전 관리 규칙

- 병원이 제안을 수정하면 **새 버전**(version +1)을 생성한다
- 기존 버전은 `is_active = false`로 남긴다 (삭제 금지)
- 고객은 과거 버전과 현재 버전을 비교할 수 있다
- 리포트는 특정 version을 참조한다 (정확도 유지)
- `UNIQUE(concern_id, member_id, version)` — 한 병원, 한 고민, 버전별 하나

### 구조화 규칙

- 비교 가능한 데이터여야 한다 — 모든 핵심 필드는 정규화된 값만 허용
- `consultation_note`만 free text (보조 용도)
- 나머지 필드는 숫자/enum/날짜로 비교 UI와 리포트 엔진이 자동 처리 가능

```sql
CREATE TABLE proposals (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  concern_id          UUID NOT NULL REFERENCES concerns(id),
  member_id           UUID NOT NULL REFERENCES members(id),
  version             INT NOT NULL DEFAULT 1,
  is_active           BOOLEAN NOT NULL DEFAULT TRUE,

  status              TEXT NOT NULL DEFAULT 'draft' CHECK (status IN (
    'draft',
    'sent',
    'viewed',
    'shortlisted',
    'selected',
    'rejected'
  )),

  -- 구조화된 제안 (비교 가능 필드)
  total_price         INT NOT NULL,
  recovery_days       INT NOT NULL,
  anesthesia_type     TEXT NOT NULL CHECK (anesthesia_type IN ('local', 'sedation', 'general')),
  hospital_stay_days  INT DEFAULT 0,
  available_date_from DATE,
  available_date_to   DATE,

  -- 보조 필드 (free text, 비교 UI에서 부가 정보로만)
  consultation_note   TEXT,

  -- 품질 관리
  quality_score       INT CHECK (quality_score >= 0 AND quality_score <= 100),
  is_flagged          BOOLEAN NOT NULL DEFAULT FALSE,

  -- 과금
  credits_charged     INT NOT NULL DEFAULT 0,

  -- 타임스탬프
  sent_at             TIMESTAMPTZ,
  viewed_at           TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE(concern_id, member_id, version)
);

CREATE TABLE proposal_items (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id     UUID NOT NULL REFERENCES proposals(id) ON DELETE CASCADE,
  treatment_name  TEXT NOT NULL,
  treatment_name_zh TEXT,
  price           INT NOT NULL,
  description     TEXT,
  sort_order      INT NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE proposal_images (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id     UUID NOT NULL REFERENCES proposals(id) ON DELETE CASCADE,
  url             TEXT NOT NULL,
  caption         TEXT,
  sort_order      INT NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

## 5. Order (모든 구매의 단위)

### 규칙
- 모든 Order는 `concern_id`를 가진다 (어떤 고민에서 발생한 매출인지 추적)
- 이것이 없으면 BO 퍼널 분석, CAC/LTV 계산 불가능

```sql
CREATE TABLE orders (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id),
  concern_id      UUID NOT NULL REFERENCES concerns(id),
  type            TEXT NOT NULL CHECK (type IN ('report', 'service')),
  status          TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending',
    'paid',
    'processing',
    'delivered',
    'completed',
    'cancelled',
    'refunded'
  )),
  price           INT NOT NULL,
  currency        TEXT NOT NULL DEFAULT 'KRW',
  paid_at         TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE report_order_details (
  order_id             UUID PRIMARY KEY REFERENCES orders(id),
  concern_id           UUID NOT NULL REFERENCES concerns(id),
  proposal_version_ref UUID REFERENCES proposals(id),  -- 어떤 제안서 버전 기준으로 분석했는지
  report_type          TEXT NOT NULL DEFAULT 'standard' CHECK (report_type IN ('standard', 'premium')),
  overtreatment_score  INT,
  price_fairness_score INT,
  risk_score           INT,
  summary              TEXT,
  full_report_url      TEXT,
  delivered_at         TIMESTAMPTZ
);

CREATE TABLE service_order_details (
  order_id        UUID PRIMARY KEY REFERENCES orders(id),
  service_type    TEXT NOT NULL CHECK (service_type IN (
    'schedule', 'interpreter', 'pickup', 'hotel',
    'butler', 'recovery_care', 'tour', 'package'
  )),
  service_date    DATE,
  notes           TEXT,
  confirmed_at    TIMESTAMPTZ,
  completed_at    TIMESTAMPTZ
);

CREATE TABLE service_package_items (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id        UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  service_type    TEXT NOT NULL,
  price           INT NOT NULL,
  sort_order      INT NOT NULL DEFAULT 0
);
```

## Extension: Article (콘텐츠 엔진)

```sql
CREATE TABLE articles (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug            TEXT UNIQUE NOT NULL,
  status          TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  category        TEXT NOT NULL CHECK (category IN (
    'procedure', 'case_study', 'pricing', 'risk', 'skincare', 'trend'
  )),
  intent          TEXT NOT NULL CHECK (intent IN ('awareness', 'consideration', 'conversion')),
  title_ko        TEXT NOT NULL,
  body_ko         TEXT NOT NULL,
  excerpt_ko      TEXT,
  title_zh        TEXT,
  body_zh         TEXT,
  excerpt_zh      TEXT,
  cover_image_url TEXT,
  tags            TEXT[] DEFAULT '{}',
  body_area       TEXT,
  view_count      INT NOT NULL DEFAULT 0,
  cta_click_count INT NOT NULL DEFAULT 0,
  published_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE article_images (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id      UUID NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  url             TEXT NOT NULL,
  alt_text        TEXT,
  sort_order      INT NOT NULL DEFAULT 0
);
```

## Extension: Event Tracking

```sql
CREATE TABLE events (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type      TEXT NOT NULL,
  actor_type      TEXT NOT NULL CHECK (actor_type IN ('user', 'member', 'system')),
  actor_id        UUID,
  target_type     TEXT,
  target_id       UUID,
  metadata        JSONB DEFAULT '{}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 필수 이벤트 (Day 1)
-- signup_completed, concern_submitted, concern_opened_by_partner
-- proposal_sent, proposal_viewed, proposal_shortlisted, proposal_revised
-- report_purchased, hospital_selected, service_purchased
-- article_viewed, article_cta_clicked
```

## Extension: Referral

```sql
CREATE TABLE referral_payouts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id     UUID NOT NULL REFERENCES users(id),
  referred_user_id UUID NOT NULL REFERENCES users(id),
  amount          INT NOT NULL,
  status          TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'cancelled')),
  paid_at         TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

---

## 상태 전이 규칙

### Concern.status 전이

```
draft              → 아무것도 안 됨
submitted          → 병원이 제안서 발송 가능
proposal_received  → 고객이 비교 가능
comparing          → 리포트 구매 CTA 노출
report_purchased   → 리포트 결과 열람 가능
hospital_selected  → 서비스 구매 가능
service_purchased  → 실행 서비스 진행
completed          → 완료
```

| 트리거 | 현재 상태 | 다음 상태 |
|--------|----------|----------|
| 첫 제안서 sent | submitted | proposal_received |
| 고객이 2개 이상 비교 | proposal_received | comparing |
| 리포트 결제 완료 | comparing | report_purchased |
| 제안서 selected | report_purchased 또는 comparing | hospital_selected |
| 서비스 결제 완료 | hospital_selected | service_purchased |

### Proposal 버전 전이

| 트리거 | 동작 |
|--------|------|
| 병원이 수정 | 기존 is_active=false, 새 row(version+1, is_active=true) 생성 |
| 고객이 열람 | active version의 status → viewed |
| 고객이 비교 선택 | active version의 status → shortlisted |
| 고객이 최종 선택 | active version의 status → selected |

---

## 인덱스

```sql
CREATE INDEX idx_concerns_user_id ON concerns(user_id);
CREATE INDEX idx_concerns_status ON concerns(status);
CREATE INDEX idx_proposals_concern_id ON proposals(concern_id);
CREATE INDEX idx_proposals_member_id ON proposals(member_id);
CREATE INDEX idx_proposals_status ON proposals(status);
CREATE INDEX idx_proposals_active ON proposals(concern_id, member_id, is_active) WHERE is_active = TRUE;
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_concern_id ON orders(concern_id);
CREATE INDEX idx_orders_type ON orders(type);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_events_event_type ON events(event_type);
CREATE INDEX idx_events_actor ON events(actor_type, actor_id);
CREATE INDEX idx_events_target ON events(target_type, target_id);
CREATE INDEX idx_articles_status ON articles(status);
CREATE INDEX idx_articles_category ON articles(category);
CREATE INDEX idx_articles_slug ON articles(slug);
```

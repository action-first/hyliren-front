-- ============================================================
-- HYLIREN — Final Schema DDL v3.0
-- Date: 2026-04-15
--
-- 핵심 변경 (vs v2.2):
--   - concerns: body_area → body_areas TEXT[] (멀티 부위)
--   - concerns: AI 상담 데이터 (raw_narrative, ai_summary, feedback_turns)
--   - report_order_details: scope (single/compare) + target_proposal_ids
--   - articles: body_area → body_areas TEXT[]
--
-- 규칙:
--   - 플랫폼 기준 통화: KRW
--   - concerns/proposals 가격: KRW 만원 (INT)
--   - orders 가격: KRW 원 (INT)
--   - CNY 변환은 클라이언트/뷰 레이어에서 처리
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- ENUM TYPES
-- ============================================================

CREATE TYPE user_role AS ENUM ('buyer', 'referrer');
CREATE TYPE member_role AS ENUM ('partner', 'admin');

CREATE TYPE concern_status AS ENUM (
  'draft',
  'submitted',
  'proposal_received',
  'comparing',
  'report_purchased',
  'hospital_selected',
  'service_purchased',
  'completed',
  'cancelled'
);

CREATE TYPE concern_source AS ENUM ('organic', 'referral', 'article', 'ad', 'direct');

CREATE TYPE proposal_status AS ENUM ('draft', 'sent', 'viewed', 'shortlisted', 'selected', 'rejected');

CREATE TYPE anesthesia_type AS ENUM ('local', 'sedation', 'general');

CREATE TYPE order_type AS ENUM ('report', 'service');

CREATE TYPE order_status AS ENUM ('pending', 'paid', 'processing', 'delivered', 'completed', 'cancelled', 'refunded');

CREATE TYPE report_type AS ENUM ('standard', 'premium');
CREATE TYPE report_scope AS ENUM ('single', 'compare');

CREATE TYPE service_type AS ENUM (
  'schedule', 'interpreter', 'pickup', 'hotel',
  'butler', 'recovery_care', 'tour', 'package'
);

CREATE TYPE subscription_plan AS ENUM ('free', 'basic', 'premium');
CREATE TYPE subscription_status AS ENUM ('active', 'cancelled', 'expired');
CREATE TYPE credit_reason AS ENUM ('purchase', 'proposal_sent', 'refund', 'bonus');

CREATE TYPE article_status AS ENUM ('draft', 'published', 'archived');
CREATE TYPE article_category AS ENUM ('procedure', 'case_study', 'pricing', 'risk', 'skincare', 'trend');
CREATE TYPE article_intent AS ENUM ('awareness', 'consideration', 'conversion');

CREATE TYPE event_actor_type AS ENUM ('user', 'member', 'system');
CREATE TYPE event_target_type AS ENUM ('concern', 'proposal', 'order', 'article', 'user', 'member');

CREATE TYPE payout_status AS ENUM ('pending', 'approved', 'paid', 'cancelled');
CREATE TYPE payout_trigger AS ENUM ('signup', 'concern_submitted');

-- ============================================================
-- 1. USER (수요측)
-- ============================================================

CREATE TABLE users (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role            user_role    NOT NULL,
  email           TEXT         UNIQUE,
  phone           TEXT,
  password_hash   TEXT,
  name            TEXT         NOT NULL,
  locale          TEXT         NOT NULL DEFAULT 'ko' CHECK (locale IN ('ko', 'zh-CN')),
  avatar_url      TEXT,
  referral_code   TEXT         UNIQUE,
  referred_by     UUID         REFERENCES users(id),
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ  NOT NULL DEFAULT now(),

  CONSTRAINT chk_user_has_identifier CHECK (email IS NOT NULL OR phone IS NOT NULL)
);

CREATE TABLE buyer_profiles (
  user_id         UUID NOT NULL PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  birth_year      INT,
  gender          TEXT CHECK (gender IN ('female', 'male', 'other')),
  country         TEXT NOT NULL DEFAULT 'CN',
  city            TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 2. MEMBER (공급측)
-- ============================================================

CREATE TABLE members (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role            member_role  NOT NULL,
  email           TEXT         UNIQUE NOT NULL,
  password_hash   TEXT,
  name            TEXT         NOT NULL,
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE TABLE partner_profiles (
  member_id       UUID NOT NULL PRIMARY KEY REFERENCES members(id) ON DELETE CASCADE,
  hospital_name   TEXT         NOT NULL,
  hospital_name_zh TEXT,
  description     TEXT,
  description_zh  TEXT,
  address         TEXT,
  phone           TEXT,
  website         TEXT,
  logo_url        TEXT,
  cover_image_url TEXT,
  specialties     TEXT[]       NOT NULL DEFAULT '{}',
  verified        BOOLEAN      NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE TABLE credit_balances (
  member_id       UUID NOT NULL PRIMARY KEY REFERENCES members(id) ON DELETE CASCADE,
  balance         INT          NOT NULL DEFAULT 0 CHECK (balance >= 0),
  updated_at      TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE TABLE credit_transactions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id       UUID         NOT NULL REFERENCES members(id),
  amount          INT          NOT NULL,
  reason          credit_reason NOT NULL,
  reference_id    UUID,
  balance_after   INT          NOT NULL,
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE TABLE subscriptions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id       UUID         NOT NULL REFERENCES members(id),
  plan            subscription_plan   NOT NULL,
  status          subscription_status NOT NULL,
  started_at      TIMESTAMPTZ  NOT NULL,
  expires_at      TIMESTAMPTZ,
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- ============================================================
-- 3. CONCERN (고민) — v3.0 멀티 부위 + AI 상담 데이터
-- ============================================================

CREATE TABLE concerns (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID         NOT NULL REFERENCES users(id),
  status          concern_status NOT NULL DEFAULT 'draft',
  source          concern_source NOT NULL DEFAULT 'organic',

  -- 부위 (멀티 부위 지원)
  body_areas      TEXT[]       NOT NULL DEFAULT '{}',
  primary_area    TEXT         NOT NULL,
  body_area_detail TEXT,

  -- 고민 내용
  description     TEXT         NOT NULL,
  raw_narrative   TEXT,
  ai_summary      JSONB,
  feedback_turns  JSONB        DEFAULT '[]',

  -- 예산/일정
  budget_min      INT,
  budget_max      INT,
  visit_date_from DATE,
  visit_date_to   DATE,
  has_passport    BOOLEAN      NOT NULL DEFAULT FALSE,

  -- 메타
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ  NOT NULL DEFAULT now(),
  deleted_at      TIMESTAMPTZ,

  CONSTRAINT chk_concern_body_areas_not_empty
    CHECK (array_length(body_areas, 1) >= 1)
);

-- ai_summary JSONB 구조:
-- {
--   "empathy": "string",
--   "education": "string",
--   "options": [{ "key", "name", "description", "bodyArea" }],
--   "extractedTags": { "symptoms": [], "preferences": [], "budget": [], "timing": [] },
--   "extractedSummary": { "bodyAreas": [], "primaryArea", "bodyAreaDetail", "desiredOutcome", "budgetMax", "visitDate" },
--   "disclaimer": "string",
--   "ruleVersion": "string"
-- }

-- feedback_turns JSONB 구조:
-- [{ "role": "user"|"ai", "message": "string" }]

CREATE TABLE concern_photos (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  concern_id      UUID NOT NULL REFERENCES concerns(id) ON DELETE CASCADE,
  url             TEXT NOT NULL,
  sort_order      INT  NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 4. PROPOSAL (제안서)
-- ============================================================

CREATE TABLE proposals (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  concern_id          UUID          NOT NULL REFERENCES concerns(id),
  member_id           UUID          NOT NULL REFERENCES members(id),
  version             INT           NOT NULL DEFAULT 1,
  is_active           BOOLEAN       NOT NULL DEFAULT TRUE,
  status              proposal_status NOT NULL DEFAULT 'draft',

  total_price         INT           NOT NULL,
  recovery_days       INT           NOT NULL,
  anesthesia_type     anesthesia_type NOT NULL,
  hospital_stay_days  INT           NOT NULL DEFAULT 0,
  available_date_from DATE,
  available_date_to   DATE,

  consultation_note   TEXT,

  quality_score       INT CHECK (quality_score >= 0 AND quality_score <= 100),
  is_flagged          BOOLEAN       NOT NULL DEFAULT FALSE,
  credits_charged     INT           NOT NULL DEFAULT 0,

  sent_at             TIMESTAMPTZ,
  viewed_at           TIMESTAMPTZ,
  created_at          TIMESTAMPTZ   NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ   NOT NULL DEFAULT now(),
  deleted_at          TIMESTAMPTZ,

  CONSTRAINT uq_proposal_version UNIQUE (concern_id, member_id, version)
);

CREATE TABLE proposal_items (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id     UUID NOT NULL REFERENCES proposals(id) ON DELETE CASCADE,
  treatment_name  TEXT NOT NULL,
  treatment_name_zh TEXT,
  price           INT  NOT NULL,
  description     TEXT,
  sort_order      INT  NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE proposal_images (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id     UUID NOT NULL REFERENCES proposals(id) ON DELETE CASCADE,
  url             TEXT NOT NULL,
  caption         TEXT,
  sort_order      INT  NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 5. ORDER (모든 구매의 단위)
-- ============================================================

CREATE TABLE orders (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID         NOT NULL REFERENCES users(id),
  concern_id      UUID         NOT NULL REFERENCES concerns(id),
  type            order_type   NOT NULL,
  status          order_status NOT NULL DEFAULT 'pending',
  price           INT          NOT NULL,
  currency        TEXT         NOT NULL DEFAULT 'KRW' CHECK (currency = 'KRW'),
  paid_at         TIMESTAMPTZ,
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE TABLE report_order_details (
  order_id             UUID NOT NULL PRIMARY KEY REFERENCES orders(id) ON DELETE CASCADE,
  concern_id           UUID NOT NULL REFERENCES concerns(id),
  scope                report_scope NOT NULL DEFAULT 'single',
  target_proposal_id   UUID REFERENCES proposals(id),
  target_proposal_ids  UUID[] DEFAULT '{}',
  report_type          report_type NOT NULL DEFAULT 'standard',
  overtreatment_score  INT CHECK (overtreatment_score >= 0 AND overtreatment_score <= 100),
  price_fairness_score INT CHECK (price_fairness_score >= 0 AND price_fairness_score <= 100),
  risk_score           INT CHECK (risk_score >= 0 AND risk_score <= 100),
  summary              TEXT,
  full_report_url      TEXT,
  delivered_at         TIMESTAMPTZ
);

-- 앱 레벨 검증:
--   scope=single  → target_proposal_id NOT NULL, target_proposal_ids = '{}'
--   scope=compare → target_proposal_id IS NULL, target_proposal_ids NOT EMPTY

CREATE TABLE service_order_details (
  order_id        UUID NOT NULL PRIMARY KEY REFERENCES orders(id) ON DELETE CASCADE,
  service_type    service_type NOT NULL,
  service_date    DATE,
  notes           TEXT,
  confirmed_at    TIMESTAMPTZ,
  completed_at    TIMESTAMPTZ
);

CREATE TABLE service_package_items (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id        UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  service_type    service_type NOT NULL,
  price           INT  NOT NULL,
  sort_order      INT  NOT NULL DEFAULT 0
);

-- ============================================================
-- 6. ARTICLE
-- ============================================================

CREATE TABLE articles (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug            TEXT UNIQUE NOT NULL,
  status          article_status   NOT NULL DEFAULT 'draft',
  category        article_category NOT NULL,
  intent          article_intent   NOT NULL,
  title_ko        TEXT NOT NULL,
  body_ko         TEXT NOT NULL,
  excerpt_ko      TEXT,
  title_zh        TEXT,
  body_zh         TEXT,
  excerpt_zh      TEXT,
  cover_image_url TEXT,
  tags            TEXT[] NOT NULL DEFAULT '{}',
  body_areas      TEXT[] DEFAULT '{}',
  view_count      INT NOT NULL DEFAULT 0,
  cta_click_count INT NOT NULL DEFAULT 0,
  published_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at      TIMESTAMPTZ
);

CREATE TABLE article_images (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id      UUID NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  url             TEXT NOT NULL,
  alt_text        TEXT,
  sort_order      INT  NOT NULL DEFAULT 0
);

-- ============================================================
-- 7. EVENT TRACKING
-- ============================================================

CREATE TABLE events (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type      TEXT NOT NULL,
  actor_type      event_actor_type NOT NULL,
  actor_id        UUID,
  target_type     event_target_type,
  target_id       UUID,
  metadata        JSONB NOT NULL DEFAULT '{}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 8. REFERRAL
-- ============================================================

CREATE TABLE referral_payouts (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id      UUID NOT NULL REFERENCES users(id),
  referred_user_id UUID NOT NULL REFERENCES users(id),
  trigger_type     payout_trigger NOT NULL,
  trigger_event_id UUID REFERENCES events(id),
  amount           INT  NOT NULL,
  status           payout_status NOT NULL DEFAULT 'pending',
  approved_at      TIMESTAMPTZ,
  paid_at          TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- INDEXES
-- ============================================================

-- User
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_referred_by ON users(referred_by) WHERE referred_by IS NOT NULL;

-- Concern
CREATE INDEX idx_concerns_user_id ON concerns(user_id);
CREATE INDEX idx_concerns_status ON concerns(status);
CREATE INDEX idx_concerns_source ON concerns(source);
CREATE INDEX idx_concerns_body_areas ON concerns USING GIN(body_areas);
CREATE INDEX idx_concerns_primary_area ON concerns(primary_area);
CREATE INDEX idx_concerns_not_deleted ON concerns(id) WHERE deleted_at IS NULL;

-- Proposal
CREATE INDEX idx_proposals_concern_id ON proposals(concern_id);
CREATE INDEX idx_proposals_member_id ON proposals(member_id);
CREATE INDEX idx_proposals_status ON proposals(status);
CREATE INDEX idx_proposals_active ON proposals(concern_id, member_id) WHERE is_active = TRUE;
CREATE UNIQUE INDEX uq_active_proposal_per_partner ON proposals(concern_id, member_id) WHERE is_active = TRUE AND deleted_at IS NULL;
CREATE INDEX idx_proposals_not_deleted ON proposals(id) WHERE deleted_at IS NULL;

-- Order
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_concern_id ON orders(concern_id);
CREATE INDEX idx_orders_type_status ON orders(type, status);

-- Credit
CREATE INDEX idx_credit_tx_member_id ON credit_transactions(member_id);

-- Subscription
CREATE INDEX idx_subscriptions_member_id ON subscriptions(member_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);

-- Article
CREATE INDEX idx_articles_status ON articles(status);
CREATE INDEX idx_articles_category ON articles(category);
CREATE INDEX idx_articles_intent ON articles(intent);
CREATE INDEX idx_articles_body_areas ON articles USING GIN(body_areas);
CREATE INDEX idx_articles_tags ON articles USING GIN(tags);
CREATE INDEX idx_articles_not_deleted ON articles(id) WHERE deleted_at IS NULL;
CREATE INDEX idx_partner_specialties ON partner_profiles USING GIN(specialties);

-- Event
CREATE INDEX idx_events_type ON events(event_type);
CREATE INDEX idx_events_actor ON events(actor_type, actor_id);
CREATE INDEX idx_events_target ON events(target_type, target_id);
CREATE INDEX idx_events_created ON events(created_at);

-- Referral
CREATE INDEX idx_referral_payouts_referrer ON referral_payouts(referrer_id);
CREATE INDEX idx_referral_payouts_status ON referral_payouts(status);

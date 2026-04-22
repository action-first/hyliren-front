-- =============================================================
-- Hyliren — Local DB Schema Initializer
-- PostgreSQL 16+
-- 컨테이너 최초 기동 시 /docker-entrypoint-initdb.d/ 에 의해 자동 실행됩니다.
-- =============================================================


-- =============================================================
-- ENUM Types
-- =============================================================

CREATE TYPE user_role   AS ENUM ('buyer', 'admin');
CREATE TYPE member_role AS ENUM ('partner', 'admin');

CREATE TYPE concern_status AS ENUM ('draft', 'submitted', 'closed');
CREATE TYPE concern_source AS ENUM ('organic', 'referral', 'campaign');

CREATE TYPE proposal_status AS ENUM ('draft', 'sent', 'accepted', 'rejected', 'expired');
CREATE TYPE anesthesia_type AS ENUM ('local', 'sedation', 'general');

CREATE TYPE order_type   AS ENUM ('report', 'service');
CREATE TYPE order_status AS ENUM ('pending', 'paid', 'cancelled', 'refunded');
CREATE TYPE service_type AS ENUM ('translation', 'escort', 'accommodation', 'transport');
CREATE TYPE report_scope AS ENUM ('single', 'multi');
CREATE TYPE report_type  AS ENUM ('standard', 'premium');

CREATE TYPE subscription_plan   AS ENUM ('basic', 'pro', 'enterprise');
CREATE TYPE subscription_status AS ENUM ('active', 'expired', 'cancelled');

CREATE TYPE credit_reason AS ENUM (
  'purchase', 'refund', 'proposal_send', 'subscription_grant', 'admin_adjust'
);

CREATE TYPE payout_trigger AS ENUM ('signup', 'first_order', 'subscription');
CREATE TYPE payout_status  AS ENUM ('pending', 'approved', 'paid', 'rejected');

CREATE TYPE event_actor_type  AS ENUM ('user', 'member', 'system');
CREATE TYPE event_target_type AS ENUM ('concern', 'proposal', 'order', 'member');

CREATE TYPE article_status   AS ENUM ('draft', 'published', 'archived');
CREATE TYPE article_category AS ENUM ('guide', 'review', 'news', 'tip');
CREATE TYPE article_intent   AS ENUM ('education', 'promotion', 'seo');

-- =============================================================
-- Tables (FK 의존 순서로 정렬)
-- =============================================================

-- ------------------------------------------------------------
-- 1. users
-- ------------------------------------------------------------
CREATE TABLE users (
  user_id       VARCHAR(28)  PRIMARY KEY,
  role          user_role    NOT NULL,
  email         VARCHAR(255) UNIQUE,
  phone         VARCHAR(20)  UNIQUE,
  password_hash VARCHAR(72),
  name          VARCHAR(100) NOT NULL,
  locale        VARCHAR(10)  NOT NULL DEFAULT 'zh-CN',
  avatar_url    TEXT,
  referral_code VARCHAR(32)  UNIQUE,
  referred_by   VARCHAR(28)  REFERENCES users(user_id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------
-- 2. buyer_profiles
-- ------------------------------------------------------------
CREATE TABLE buyer_profiles (
  user_id    VARCHAR(28)  PRIMARY KEY REFERENCES users(user_id) ON DELETE CASCADE,
  birth_year INT,
  gender     VARCHAR(10),
  country    CHAR(2)      NOT NULL DEFAULT 'CN',
  city       VARCHAR(100),
  created_at TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------
-- 3. members
-- ------------------------------------------------------------
CREATE TABLE members (
  member_id     VARCHAR(28)  PRIMARY KEY,
  role          member_role  NOT NULL,
  email         VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(72),
  name          VARCHAR(100) NOT NULL,
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------
-- 4. partner_profiles
-- ------------------------------------------------------------
CREATE TABLE partner_profiles (
  member_id        VARCHAR(28)  PRIMARY KEY REFERENCES members(member_id) ON DELETE CASCADE,
  hospital_name    VARCHAR(200) NOT NULL,
  hospital_name_zh VARCHAR(200),
  description      TEXT,
  description_zh   TEXT,
  address          VARCHAR(500),
  phone            VARCHAR(20),
  website          VARCHAR(512),
  logo_url         TEXT,
  cover_image_url  TEXT,
  specialties      JSONB        NOT NULL DEFAULT '[]',
  verified         BOOLEAN      NOT NULL DEFAULT false,
  created_at       TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------
-- 5. subscriptions
-- ------------------------------------------------------------
CREATE TABLE subscriptions (
  subscription_id VARCHAR(28)         PRIMARY KEY,
  member_id       VARCHAR(28)         NOT NULL REFERENCES members(member_id) ON DELETE CASCADE,
  plan            subscription_plan   NOT NULL,
  status          subscription_status NOT NULL,
  started_at      TIMESTAMPTZ         NOT NULL DEFAULT now(),
  expires_at      TIMESTAMPTZ,
  created_at      TIMESTAMPTZ         NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------
-- 6. credit_balances
-- ------------------------------------------------------------
CREATE TABLE credit_balances (
  member_id  VARCHAR(28) PRIMARY KEY REFERENCES members(member_id) ON DELETE CASCADE,
  balance    INT         NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------
-- 7. credit_transactions
-- ------------------------------------------------------------
CREATE TABLE credit_transactions (
  credit_transaction_id VARCHAR(28)   PRIMARY KEY,
  member_id             VARCHAR(28)   NOT NULL REFERENCES members(member_id) ON DELETE CASCADE,
  amount                INT           NOT NULL,
  reason                credit_reason NOT NULL,
  reference_id          VARCHAR(28),
  balance_after         INT           NOT NULL,
  created_at            TIMESTAMPTZ   NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------
-- 8. concerns
-- ------------------------------------------------------------
CREATE TABLE concerns (
  concern_id       VARCHAR(28)    PRIMARY KEY,
  user_id          VARCHAR(28)    NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  status           concern_status NOT NULL DEFAULT 'draft',
  source           concern_source NOT NULL DEFAULT 'organic',
  body_areas       JSONB          NOT NULL DEFAULT '[]',
  primary_area     VARCHAR(50)    NOT NULL,
  body_area_detail VARCHAR(300),
  description      TEXT           NOT NULL,
  raw_narrative    TEXT,
  ai_summary       JSONB,
  feedback_turns   JSONB          NOT NULL DEFAULT '[]',
  budget_min       INT,
  budget_max       INT,
  visit_date_from  DATE,
  visit_date_to    DATE,
  has_passport     BOOLEAN        NOT NULL DEFAULT false,
  created_at       TIMESTAMPTZ    NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ    NOT NULL DEFAULT now(),
  deleted_at       TIMESTAMPTZ
);

-- ------------------------------------------------------------
-- 9. concern_photos
-- ------------------------------------------------------------
CREATE TABLE concern_photos (
  concern_photo_id VARCHAR(28) PRIMARY KEY,
  concern_id       VARCHAR(28) NOT NULL REFERENCES concerns(concern_id) ON DELETE CASCADE,
  url              TEXT        NOT NULL,
  sort_order       INT         NOT NULL DEFAULT 0,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------
-- 10. proposals
-- ------------------------------------------------------------
CREATE TABLE proposals (
  proposal_id         VARCHAR(28)     PRIMARY KEY,
  concern_id          VARCHAR(28)     NOT NULL REFERENCES concerns(concern_id) ON DELETE CASCADE,
  member_id           VARCHAR(28)     NOT NULL REFERENCES members(member_id) ON DELETE CASCADE,
  version             INT             NOT NULL DEFAULT 1,
  is_active           BOOLEAN         NOT NULL DEFAULT true,
  status              proposal_status NOT NULL DEFAULT 'draft',
  total_price         INT             NOT NULL,
  recovery_days       INT             NOT NULL DEFAULT 0,
  anesthesia_type     anesthesia_type NOT NULL,
  hospital_stay_days  INT             NOT NULL DEFAULT 0,
  available_date_from DATE,
  available_date_to   DATE,
  consultation_note   TEXT,
  quality_score       INT,
  is_flagged          BOOLEAN         NOT NULL DEFAULT false,
  credits_charged     INT             NOT NULL DEFAULT 0,
  sent_at             TIMESTAMPTZ,
  viewed_at           TIMESTAMPTZ,
  created_at          TIMESTAMPTZ     NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ     NOT NULL DEFAULT now(),
  deleted_at          TIMESTAMPTZ
);

-- ------------------------------------------------------------
-- 11. proposal_items
-- ------------------------------------------------------------
CREATE TABLE proposal_items (
  proposal_item_id  VARCHAR(28) PRIMARY KEY,
  proposal_id       VARCHAR(28) NOT NULL REFERENCES proposals(proposal_id) ON DELETE CASCADE,
  treatment_name    VARCHAR(200) NOT NULL,
  treatment_name_zh VARCHAR(200),
  price             INT         NOT NULL,
  description       TEXT,
  sort_order        INT         NOT NULL DEFAULT 0,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------
-- 12. proposal_images
-- ------------------------------------------------------------
CREATE TABLE proposal_images (
  proposal_image_id VARCHAR(28) PRIMARY KEY,
  proposal_id       VARCHAR(28) NOT NULL REFERENCES proposals(proposal_id) ON DELETE CASCADE,
  url               TEXT         NOT NULL,
  caption           VARCHAR(500),
  sort_order        INT         NOT NULL DEFAULT 0,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------
-- 13. hospital_selections
-- ------------------------------------------------------------
CREATE TABLE hospital_selections (
  selection_id  VARCHAR(28)  PRIMARY KEY,
  concern_id    VARCHAR(28)  NOT NULL REFERENCES concerns(concern_id) ON DELETE CASCADE,
  proposal_id   VARCHAR(28)  NOT NULL REFERENCES proposals(proposal_id) ON DELETE CASCADE,
  selected_at   TIMESTAMPTZ  NOT NULL DEFAULT now(),
  UNIQUE (concern_id)
);

-- ------------------------------------------------------------
-- 14. orders
-- ------------------------------------------------------------
CREATE TABLE orders (
  order_id   VARCHAR(28)  PRIMARY KEY,
  user_id    VARCHAR(28)  NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  concern_id VARCHAR(28)  NOT NULL REFERENCES concerns(concern_id) ON DELETE CASCADE,
  type       order_type   NOT NULL,
  status     order_status NOT NULL DEFAULT 'pending',
  price      INT          NOT NULL,
  currency   CHAR(3)      NOT NULL DEFAULT 'KRW',
  paid_at    TIMESTAMPTZ,
  created_at TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------
-- 14. report_order_details
-- ------------------------------------------------------------
CREATE TABLE report_order_details (
  order_id             VARCHAR(28)  PRIMARY KEY REFERENCES orders(order_id) ON DELETE CASCADE,
  concern_id           VARCHAR(28)  NOT NULL REFERENCES concerns(concern_id) ON DELETE RESTRICT,
  scope                report_scope NOT NULL DEFAULT 'single',
  target_proposal_id   VARCHAR(28)  REFERENCES proposals(proposal_id) ON DELETE SET NULL,
  target_proposal_ids  VARCHAR(28),
  report_type          report_type  NOT NULL DEFAULT 'standard',
  overtreatment_score  INT,
  price_fairness_score INT,
  risk_score           INT,
  summary              TEXT,
  full_report_url      TEXT,
  delivered_at         TIMESTAMPTZ
);

-- ------------------------------------------------------------
-- 15. service_order_details
-- ------------------------------------------------------------
CREATE TABLE service_order_details (
  order_id     VARCHAR(28)  PRIMARY KEY REFERENCES orders(order_id) ON DELETE CASCADE,
  service_type service_type NOT NULL,
  service_date DATE,
  notes        TEXT,
  confirmed_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);

-- ------------------------------------------------------------
-- 16. service_package_items
-- ------------------------------------------------------------
CREATE TABLE service_package_items (
  service_package_item_id VARCHAR(28)  PRIMARY KEY,
  order_id                VARCHAR(28)  NOT NULL REFERENCES orders(order_id) ON DELETE CASCADE,
  service_type            service_type NOT NULL,
  price                   INT          NOT NULL,
  sort_order              INT          NOT NULL DEFAULT 0
);

-- ------------------------------------------------------------
-- 17. referral_payouts
-- ------------------------------------------------------------
CREATE TABLE referral_payouts (
  referral_payout_id VARCHAR(28)    PRIMARY KEY,
  referrer_id        VARCHAR(28)    NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  referred_user_id   VARCHAR(28)    NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  trigger_type       payout_trigger NOT NULL,
  trigger_event_id   VARCHAR(28),
  amount             INT            NOT NULL,
  status             payout_status  NOT NULL DEFAULT 'pending',
  approved_at        TIMESTAMPTZ,
  paid_at            TIMESTAMPTZ,
  created_at         TIMESTAMPTZ    NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------
-- 18. events
-- ------------------------------------------------------------
CREATE TABLE events (
  event_id    VARCHAR(28)       PRIMARY KEY,
  event_type  VARCHAR(100)      NOT NULL,
  actor_type  event_actor_type  NOT NULL,
  actor_id    VARCHAR(28),
  target_type event_target_type,
  target_id   VARCHAR(28),
  metadata    JSONB             NOT NULL DEFAULT '{}',
  created_at  TIMESTAMPTZ       NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------
-- 19. articles
-- ------------------------------------------------------------
CREATE TABLE articles (
  article_id       VARCHAR(28)      PRIMARY KEY,
  slug             VARCHAR(200)     NOT NULL UNIQUE,
  status           article_status   NOT NULL DEFAULT 'draft',
  category         article_category NOT NULL,
  intent           article_intent   NOT NULL,
  title_ko         VARCHAR(300)     NOT NULL,
  body_ko          TEXT             NOT NULL,
  excerpt_ko       VARCHAR(500),
  title_zh         VARCHAR(300),
  body_zh          TEXT,
  excerpt_zh       VARCHAR(500),
  cover_image_url  TEXT,
  tags             JSONB            NOT NULL DEFAULT '[]',
  body_areas       JSONB            NOT NULL DEFAULT '[]',
  view_count       INT              NOT NULL DEFAULT 0,
  cta_click_count  INT              NOT NULL DEFAULT 0,
  published_at     TIMESTAMPTZ,
  created_at       TIMESTAMPTZ      NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ      NOT NULL DEFAULT now(),
  deleted_at       TIMESTAMPTZ
);

-- ------------------------------------------------------------
-- 20. article_images
-- ------------------------------------------------------------
CREATE TABLE article_images (
  article_image_id VARCHAR(28) PRIMARY KEY,
  article_id       VARCHAR(28) NOT NULL REFERENCES articles(article_id) ON DELETE CASCADE,
  url              TEXT         NOT NULL,
  alt_text         VARCHAR(300),
  sort_order       INT  NOT NULL DEFAULT 0
);

-- =============================================================
-- Indexes
-- =============================================================

CREATE INDEX idx_concerns_user_id     ON concerns(user_id);
CREATE INDEX idx_concerns_status      ON concerns(status);
CREATE INDEX idx_concerns_deleted_at  ON concerns(deleted_at) WHERE deleted_at IS NULL;

CREATE INDEX idx_proposals_concern_id ON proposals(concern_id);
CREATE INDEX idx_proposals_member_id  ON proposals(member_id);
CREATE INDEX idx_proposals_status     ON proposals(status);
CREATE INDEX idx_proposals_deleted_at ON proposals(deleted_at) WHERE deleted_at IS NULL;

CREATE INDEX idx_orders_user_id       ON orders(user_id);
CREATE INDEX idx_orders_status        ON orders(status);

CREATE INDEX idx_events_actor_id      ON events(actor_id);
CREATE INDEX idx_events_target_id     ON events(target_id);
CREATE INDEX idx_events_event_type    ON events(event_type);

CREATE INDEX idx_credit_txn_member_id ON credit_transactions(member_id);
CREATE INDEX idx_referral_payouts_ref ON referral_payouts(referrer_id);

CREATE INDEX idx_articles_slug        ON articles(slug);
CREATE INDEX idx_articles_status      ON articles(status);
CREATE INDEX idx_articles_deleted_at  ON articles(deleted_at) WHERE deleted_at IS NULL;

-- =============================================================
-- Table & Column Comments
-- =============================================================

-- ------------------------------------------------------------
-- users
-- ------------------------------------------------------------
COMMENT ON TABLE users IS '고객(엔드유저) 계정. Customer App의 인증 주체이며, 중국인 의료관광 고객이 주 사용자. buyer_profiles(1:1), concerns(1:N), orders(1:N), referral_payouts(1:N)의 루트.';
COMMENT ON COLUMN users.user_id       IS '사용자 고유 식별자 (ULID 기반, 28자)';
COMMENT ON COLUMN users.role          IS '사용자 권한: buyer(일반 고객) / admin(내부 관리자)';
COMMENT ON COLUMN users.email         IS '로그인 이메일 (고유, 선택)';
COMMENT ON COLUMN users.phone         IS '전화번호 (고유, WeChat/전화 인증 대비 nullable)';
COMMENT ON COLUMN users.password_hash IS 'bcrypt 해시된 비밀번호';
COMMENT ON COLUMN users.name          IS '실명 혹은 표시 이름';
COMMENT ON COLUMN users.locale        IS '다국어 로케일 (기본값 zh-CN)';
COMMENT ON COLUMN users.avatar_url    IS '프로필 아바타 이미지 URL';
COMMENT ON COLUMN users.referral_code IS '사용자 고유 추천 코드 (바이럴 성장용, 고유)';
COMMENT ON COLUMN users.referred_by   IS '이 사용자를 추천한 사용자의 ID (self-reference, 리퍼럴 체인 추적)';
COMMENT ON COLUMN users.created_at    IS '가입 일시';
COMMENT ON COLUMN users.updated_at    IS '최종 수정 일시';

-- ------------------------------------------------------------
-- buyer_profiles
-- ------------------------------------------------------------
COMMENT ON TABLE buyer_profiles IS '고객(엔드유저) 인구통계 프로필. 고민 매칭 · 세그먼트 분석에 사용되는 구매자 부가정보. users와 1:1.';
COMMENT ON COLUMN buyer_profiles.user_id    IS '사용자 ID (users.user_id FK, 1:1 관계의 PK)';
COMMENT ON COLUMN buyer_profiles.birth_year IS '출생 연도 (시술 적합성 판단용)';
COMMENT ON COLUMN buyer_profiles.gender     IS '성별 (male/female/other 등, 추측)';
COMMENT ON COLUMN buyer_profiles.country    IS '거주 국가 (ISO 코드 또는 국가명, 추측)';
COMMENT ON COLUMN buyer_profiles.city       IS '거주 도시 (타겟 세그먼트 분석용)';
COMMENT ON COLUMN buyer_profiles.created_at IS '프로필 생성 일시';

-- ------------------------------------------------------------
-- members
-- ------------------------------------------------------------
COMMENT ON TABLE members IS '병원 담당자 및 플랫폼 관리자 계정. Partner App / Admin App의 인증 주체. users와 분리된 B2B 측 계정 테이블. partner_profiles(1:1), credit_balances(1:1), subscriptions(1:N), proposals(1:N)의 루트.';
COMMENT ON COLUMN members.member_id     IS '멤버 고유 식별자 (ULID 기반, 28자)';
COMMENT ON COLUMN members.role          IS '멤버 권한: partner(병원) / admin(플랫폼 관리자)';
COMMENT ON COLUMN members.email         IS '로그인 이메일 (고유)';
COMMENT ON COLUMN members.password_hash IS 'bcrypt 해시된 비밀번호';
COMMENT ON COLUMN members.name          IS '담당자 이름 혹은 표시 이름';
COMMENT ON COLUMN members.created_at    IS '계정 생성 일시';
COMMENT ON COLUMN members.updated_at    IS '최종 수정 일시';

-- ------------------------------------------------------------
-- partner_profiles
-- ------------------------------------------------------------
COMMENT ON TABLE partner_profiles IS '병원(파트너) 상세 프로필. 고객에게 노출되는 병원 소개 정보. 한국어/중국어 다국어 지원. members와 1:1.';
COMMENT ON COLUMN partner_profiles.member_id        IS '멤버 ID (members.member_id FK, 1:1 관계의 PK)';
COMMENT ON COLUMN partner_profiles.hospital_name    IS '병원명 (한국어)';
COMMENT ON COLUMN partner_profiles.hospital_name_zh IS '병원명 (중국어 번역)';
COMMENT ON COLUMN partner_profiles.description      IS '병원 소개 (한국어)';
COMMENT ON COLUMN partner_profiles.description_zh   IS '병원 소개 (중국어 번역)';
COMMENT ON COLUMN partner_profiles.address          IS '병원 주소 (추측)';
COMMENT ON COLUMN partner_profiles.phone            IS '병원 대표 전화번호 (추측)';
COMMENT ON COLUMN partner_profiles.website          IS '병원 공식 웹사이트 URL (추측)';
COMMENT ON COLUMN partner_profiles.logo_url         IS '병원 로고 이미지 URL';
COMMENT ON COLUMN partner_profiles.cover_image_url  IS '프로필 상단 커버 이미지 URL';
COMMENT ON COLUMN partner_profiles.specialties      IS '전문 분야 / 시술 카테고리 (JSONB 배열)';
COMMENT ON COLUMN partner_profiles.verified         IS '관리자 심사(검증) 완료 여부';
COMMENT ON COLUMN partner_profiles.created_at       IS '프로필 생성 일시';

-- ------------------------------------------------------------
-- subscriptions
-- ------------------------------------------------------------
COMMENT ON TABLE subscriptions IS '병원(멤버)의 구독 이력. B2B 월정액 수익 모델의 근거 데이터. 고객 고민 DB 열람권의 근거가 된다.';
COMMENT ON COLUMN subscriptions.subscription_id IS '구독 고유 식별자 (ULID 기반, 28자)';
COMMENT ON COLUMN subscriptions.member_id       IS '구독 주체 멤버 ID (members.member_id FK)';
COMMENT ON COLUMN subscriptions.plan            IS '구독 등급: basic / pro / enterprise';
COMMENT ON COLUMN subscriptions.status          IS '구독 상태: active / expired / cancelled';
COMMENT ON COLUMN subscriptions.started_at      IS '구독 시작 일시';
COMMENT ON COLUMN subscriptions.expires_at      IS '구독 만료 일시 (null이면 무기한, 추측)';
COMMENT ON COLUMN subscriptions.created_at      IS '레코드 생성 일시';

-- ------------------------------------------------------------
-- credit_balances
-- ------------------------------------------------------------
COMMENT ON TABLE credit_balances IS '병원(멤버)의 크레딧 현재 잔액. 제안서 발송 시 차감되며, 병원당 1개만 존재 (members와 1:1). 거래 이력은 credit_transactions에 별도 기록.';
COMMENT ON COLUMN credit_balances.member_id  IS '멤버 ID (members.member_id FK, 1:1 관계의 PK)';
COMMENT ON COLUMN credit_balances.balance    IS '현재 보유 크레딧 수량';
COMMENT ON COLUMN credit_balances.updated_at IS '잔액 최종 변경 일시';

-- ------------------------------------------------------------
-- credit_transactions
-- ------------------------------------------------------------
COMMENT ON TABLE credit_transactions IS '병원 크레딧 거래 내역 (append-only 원장). 충전 · 사용 · 환불 · 관리자 조정 등 크레딧 잔액 변동을 모두 기록한다. 감사(audit) · 정산 용도로 사용되며 credit_balances의 변경 근거가 된다.';
COMMENT ON COLUMN credit_transactions.credit_transaction_id IS '거래 고유 식별자 (ULID 기반, 28자)';
COMMENT ON COLUMN credit_transactions.member_id             IS '거래 주체 멤버 ID (members.member_id FK)';
COMMENT ON COLUMN credit_transactions.amount                IS '거래 수량 (양수=충전/지급, 음수=사용/차감)';
COMMENT ON COLUMN credit_transactions.reason                IS '거래 사유: purchase / refund / proposal_send / subscription_grant / admin_adjust';
COMMENT ON COLUMN credit_transactions.reference_id          IS '관련 엔티티 ID (예: 제안서 발송이면 proposal_id)';
COMMENT ON COLUMN credit_transactions.balance_after         IS '이 거래 직후의 크레딧 잔액 (감사 추적용)';
COMMENT ON COLUMN credit_transactions.created_at            IS '거래 기록 일시';

-- ------------------------------------------------------------
-- concerns
-- ------------------------------------------------------------
COMMENT ON TABLE concerns IS '플랫폼의 핵심 자산 — 고객이 등록한 성형 고민 (Decision Layer 입력). 구독 병원이 열람하고 제안서(proposals)를 발송하는 대상이며, 리포트 주문의 컨텍스트가 된다. 소프트 삭제(deleted_at) 지원.';
COMMENT ON COLUMN concerns.concern_id      IS '고민 고유 식별자 (ULID 기반, 28자)';
COMMENT ON COLUMN concerns.user_id         IS '고민을 등록한 고객 ID (users.user_id FK)';
COMMENT ON COLUMN concerns.status          IS '고민 상태: draft → submitted(pending_review/proposals_waiting) → comparing → hospital_selected → completed / cancelled';
COMMENT ON COLUMN concerns.source          IS '유입 경로: organic / referral / campaign';
COMMENT ON COLUMN concerns.body_areas      IS '관심 시술 부위 목록 (JSONB 배열)';
COMMENT ON COLUMN concerns.primary_area    IS '주된 시술 부위 (예: 눈 / 코 / 턱)';
COMMENT ON COLUMN concerns.body_area_detail IS '부위 세부 서술 (예: "쌍꺼풀 + 앞트임", 추측)';
COMMENT ON COLUMN concerns.description     IS '고객이 서술한 고민 내용 (정제된 본문, 추측)';
COMMENT ON COLUMN concerns.raw_narrative   IS '고객 최초 입력 원문 (가공 전 텍스트, 추측)';
COMMENT ON COLUMN concerns.ai_summary      IS 'AI 분석 구조화 요약 (JSONB)';
COMMENT ON COLUMN concerns.feedback_turns  IS 'AI 상담 대화 히스토리 (턴 배열, JSONB)';
COMMENT ON COLUMN concerns.budget_min      IS '희망 예산 하한 (통화는 별도 필드/기본값에 종속, 추측)';
COMMENT ON COLUMN concerns.budget_max      IS '희망 예산 상한 (통화는 별도 필드/기본값에 종속, 추측)';
COMMENT ON COLUMN concerns.visit_date_from IS '방한 희망 시기 시작일';
COMMENT ON COLUMN concerns.visit_date_to   IS '방한 희망 시기 종료일';
COMMENT ON COLUMN concerns.has_passport    IS '여권 보유 여부 (실제 방한 가능성/확정도 판단에 활용)';
COMMENT ON COLUMN concerns.created_at      IS '고민 등록 일시';
COMMENT ON COLUMN concerns.updated_at      IS '최종 수정 일시';
COMMENT ON COLUMN concerns.deleted_at      IS '소프트 삭제 일시 (null이면 활성, 데이터 보존용)';

-- ------------------------------------------------------------
-- concern_photos
-- ------------------------------------------------------------
COMMENT ON TABLE concern_photos IS '고민(concerns)에 첨부된 사진. AI 분석 및 병원의 제안서 작성 참고 자료로 사용된다.';
COMMENT ON COLUMN concern_photos.concern_photo_id IS '사진 고유 식별자 (ULID 기반, 28자)';
COMMENT ON COLUMN concern_photos.concern_id       IS '소속 고민 ID (concerns.concern_id FK)';
COMMENT ON COLUMN concern_photos.url              IS '사진 파일 URL (스토리지 경로)';
COMMENT ON COLUMN concern_photos.sort_order       IS '갤러리 표시 정렬 순서 (낮을수록 앞)';
COMMENT ON COLUMN concern_photos.created_at       IS '업로드 일시';

-- ------------------------------------------------------------
-- proposals
-- ------------------------------------------------------------
COMMENT ON TABLE proposals IS '병원이 특정 고민에 대해 발송한 시술 제안서 (Decision Layer 출력). 경쟁 입찰의 핵심 — 동일 포맷으로 비교 가능하도록 가격/회복/마취 등 구조화. version + is_active 조합으로 수정/재발송 이력 관리. 소프트 삭제(deleted_at) 지원.';
COMMENT ON COLUMN proposals.proposal_id        IS '제안서 고유 식별자 (ULID 기반, 28자)';
COMMENT ON COLUMN proposals.concern_id         IS '대상 고민 ID (concerns.concern_id FK)';
COMMENT ON COLUMN proposals.member_id          IS '발송한 병원 멤버 ID (members.member_id FK)';
COMMENT ON COLUMN proposals.version            IS '제안서 수정 버전 (수정 시 증가)';
COMMENT ON COLUMN proposals.is_active          IS '동일 (concern_id, member_id) 중 최신 활성 버전 여부';
COMMENT ON COLUMN proposals.status             IS '제안서 상태: draft → active(sent/viewed) → withdrawn 등';
COMMENT ON COLUMN proposals.total_price        IS '총 시술 비용';
COMMENT ON COLUMN proposals.recovery_days      IS '예상 회복 기간 (일 단위)';
COMMENT ON COLUMN proposals.anesthesia_type    IS '마취 종류: local / sedation / general';
COMMENT ON COLUMN proposals.hospital_stay_days IS '예상 입원 일수 (외래면 0)';
COMMENT ON COLUMN proposals.available_date_from IS '시술 가능 시작일';
COMMENT ON COLUMN proposals.available_date_to   IS '시술 가능 종료일';
COMMENT ON COLUMN proposals.consultation_note  IS '의사/상담 메모 (고객 표시용)';
COMMENT ON COLUMN proposals.quality_score      IS '제안서 품질 점수 (관리자/AI 평가)';
COMMENT ON COLUMN proposals.is_flagged         IS '관리자 플래그 (저품질/스팸 의심)';
COMMENT ON COLUMN proposals.credits_charged    IS '발송 시 차감된 크레딧 수량';
COMMENT ON COLUMN proposals.sent_at            IS '고객에게 발송된(공개된) 일시';
COMMENT ON COLUMN proposals.viewed_at          IS '고객이 최초 열람한 일시';
COMMENT ON COLUMN proposals.created_at         IS '제안서 작성 일시';
COMMENT ON COLUMN proposals.updated_at         IS '최종 수정 일시';
COMMENT ON COLUMN proposals.deleted_at         IS '소프트 삭제 일시 (null이면 활성)';

-- ------------------------------------------------------------
-- proposal_items
-- ------------------------------------------------------------
COMMENT ON TABLE proposal_items IS '제안서에 포함된 개별 시술 항목. 제안서 총액(total_price)의 구성 근거이며, 동일 포맷 비교의 단위가 된다.';
COMMENT ON COLUMN proposal_items.proposal_item_id  IS '항목 고유 식별자 (ULID 기반, 28자)';
COMMENT ON COLUMN proposal_items.proposal_id       IS '소속 제안서 ID (proposals.proposal_id FK)';
COMMENT ON COLUMN proposal_items.treatment_name    IS '시술명 (한국어)';
COMMENT ON COLUMN proposal_items.treatment_name_zh IS '시술명 (중국어 번역)';
COMMENT ON COLUMN proposal_items.price             IS '항목별 가격';
COMMENT ON COLUMN proposal_items.description       IS '시술 상세 설명 (추측)';
COMMENT ON COLUMN proposal_items.sort_order        IS '표시 정렬 순서 (낮을수록 앞)';
COMMENT ON COLUMN proposal_items.created_at        IS '항목 추가 일시';

-- ------------------------------------------------------------
-- proposal_images
-- ------------------------------------------------------------
COMMENT ON TABLE proposal_images IS '제안서에 첨부된 이미지. 전/후 사진, 시뮬레이션 등 제안서 설득력을 높이는 시각 자료.';
COMMENT ON COLUMN proposal_images.proposal_image_id IS '이미지 고유 식별자 (ULID 기반, 28자)';
COMMENT ON COLUMN proposal_images.proposal_id       IS '소속 제안서 ID (proposals.proposal_id FK)';
COMMENT ON COLUMN proposal_images.url               IS '이미지 파일 URL (스토리지 경로)';
COMMENT ON COLUMN proposal_images.caption           IS '이미지 캡션/설명 (추측)';
COMMENT ON COLUMN proposal_images.sort_order        IS '갤러리 표시 정렬 순서 (낮을수록 앞)';
COMMENT ON COLUMN proposal_images.created_at        IS '업로드 일시';

-- ------------------------------------------------------------
-- orders
-- ------------------------------------------------------------
COMMENT ON TABLE orders IS '모든 B2C 과금의 중심 테이블. 검증 리포트 구매(report)와 Execution 서비스 구매(service)를 단일 주문 구조로 통합. STI 패턴 — type에 따라 report_order_details 또는 service_order_details와 1:1 연결.';
COMMENT ON COLUMN orders.order_id   IS '주문 고유 식별자 (ULID 기반, 28자)';
COMMENT ON COLUMN orders.user_id    IS '주문한 고객 ID (users.user_id FK)';
COMMENT ON COLUMN orders.concern_id IS '관련 고민 ID (concerns.concern_id FK)';
COMMENT ON COLUMN orders.type       IS '주문 종류: report(검증 리포트) / service(Execution 서비스)';
COMMENT ON COLUMN orders.status     IS '결제/처리 상태: pending → paid → cancelled / refunded';
COMMENT ON COLUMN orders.price      IS '결제 금액 (currency 기준 최소 단위, 추측)';
COMMENT ON COLUMN orders.currency   IS '결제 통화 코드 (ISO 4217, 기본값 KRW)';
COMMENT ON COLUMN orders.paid_at    IS '결제 완료 일시 (null이면 미결제)';
COMMENT ON COLUMN orders.created_at IS '주문 생성 일시';
COMMENT ON COLUMN orders.updated_at IS '최종 수정 일시';

-- ------------------------------------------------------------
-- report_order_details
-- ------------------------------------------------------------
COMMENT ON TABLE report_order_details IS '플랜 검증 리포트 주문 상세 — Decision Layer의 B2C 수익 핵심. orders(type=report)와 1:1. 특정 고민과 (단일 또는 복수) 제안서에 대한 과잉진료/가격/리스크 분석 결과를 담는다.';
COMMENT ON COLUMN report_order_details.order_id             IS '주문 ID (orders.order_id FK, 1:1 관계의 PK)';
COMMENT ON COLUMN report_order_details.concern_id           IS '분석 대상 고민 ID (concerns.concern_id FK)';
COMMENT ON COLUMN report_order_details.scope                IS '분석 범위: single(단일 제안서) / multi(복수 제안서 비교)';
COMMENT ON COLUMN report_order_details.target_proposal_id   IS '단일 분석 대상 제안서 ID (scope=single일 때 사용)';
COMMENT ON COLUMN report_order_details.target_proposal_ids  IS '복수 분석 대상 제안서 ID 목록 (scope=multi일 때 사용, 직렬화된 ID 묶음, 추측)';
COMMENT ON COLUMN report_order_details.report_type          IS '리포트 등급: standard / premium';
COMMENT ON COLUMN report_order_details.overtreatment_score  IS '과잉진료 점수 (AI 분석 결과)';
COMMENT ON COLUMN report_order_details.price_fairness_score IS '가격 적정성 점수 (AI 분석 결과)';
COMMENT ON COLUMN report_order_details.risk_score           IS '시술 리스크 점수 (AI 분석 결과)';
COMMENT ON COLUMN report_order_details.summary              IS '리포트 요약 텍스트 (본문 발췌)';
COMMENT ON COLUMN report_order_details.full_report_url      IS '전문 리포트 파일/페이지 URL';
COMMENT ON COLUMN report_order_details.delivered_at         IS '리포트 고객 전달 완료 일시';

-- ------------------------------------------------------------
-- service_order_details
-- ------------------------------------------------------------
COMMENT ON TABLE service_order_details IS 'Execution 서비스 주문 상세 — 통역 · 동행 · 숙박 · 이동 등 부가 서비스. orders(type=service)와 1:1. 패키지 구성은 service_package_items에 분리 기록.';
COMMENT ON COLUMN service_order_details.order_id     IS '주문 ID (orders.order_id FK, 1:1 관계의 PK)';
COMMENT ON COLUMN service_order_details.service_type IS '서비스 종류: translation / escort / accommodation / transport';
COMMENT ON COLUMN service_order_details.service_date IS '서비스 제공 날짜';
COMMENT ON COLUMN service_order_details.notes        IS '운영자/고객 요청 메모 (추측)';
COMMENT ON COLUMN service_order_details.confirmed_at IS '운영팀 확정 일시';
COMMENT ON COLUMN service_order_details.completed_at IS '서비스 완료 처리 일시';

-- ------------------------------------------------------------
-- service_package_items
-- ------------------------------------------------------------
COMMENT ON TABLE service_package_items IS 'VIP 서비스 패키지 구성 항목. 하나의 service 주문(orders)에 여러 서비스 항목을 결합할 때 사용.';
COMMENT ON COLUMN service_package_items.service_package_item_id IS '패키지 항목 고유 식별자 (ULID 기반, 28자)';
COMMENT ON COLUMN service_package_items.order_id                IS '소속 주문 ID (orders.order_id FK)';
COMMENT ON COLUMN service_package_items.service_type            IS '서비스 종류: translation / escort / accommodation / transport';
COMMENT ON COLUMN service_package_items.price                   IS '항목별 가격 (주문 통화 기준, 추측)';
COMMENT ON COLUMN service_package_items.sort_order              IS '표시 정렬 순서 (낮을수록 앞)';

-- ------------------------------------------------------------
-- referral_payouts
-- ------------------------------------------------------------
COMMENT ON TABLE referral_payouts IS '추천인 보상(리퍼럴 페이아웃) 기록. 바이럴 성장 엔진의 정산 원장 — 어떤 이벤트가 어떤 추천인에게 어떤 보상을 발생시켰는지 추적하고 승인/지급 상태를 관리한다.';
COMMENT ON COLUMN referral_payouts.referral_payout_id IS '보상 레코드 고유 식별자 (ULID 기반, 28자)';
COMMENT ON COLUMN referral_payouts.referrer_id        IS '추천한 사용자 ID (users.user_id FK, 보상 수령자)';
COMMENT ON COLUMN referral_payouts.referred_user_id   IS '추천받은(신규 가입) 사용자 ID (users.user_id FK)';
COMMENT ON COLUMN referral_payouts.trigger_type       IS '보상 트리거 조건: signup / first_order / subscription';
COMMENT ON COLUMN referral_payouts.trigger_event_id   IS '보상 발생 근거 이벤트 ID (events.event_id FK)';
COMMENT ON COLUMN referral_payouts.amount             IS '보상 금액 (통화 단위는 운영 정책에 종속, 추측)';
COMMENT ON COLUMN referral_payouts.status             IS '지급 상태: pending → approved → paid / rejected';
COMMENT ON COLUMN referral_payouts.approved_at        IS '관리자 승인 일시';
COMMENT ON COLUMN referral_payouts.paid_at            IS '실제 지급 완료 일시';
COMMENT ON COLUMN referral_payouts.created_at         IS '보상 레코드 생성 일시';

-- ------------------------------------------------------------
-- events
-- ------------------------------------------------------------
COMMENT ON TABLE events IS '플랫폼 전체 감사(audit) · 분석 · 트리거 로그 (이벤트 소싱 테이블). 모든 주요 행위를 단일 테이블에 기록해 분석 · 디버깅 · 리퍼럴 지급 판정의 근거로 사용한다.';
COMMENT ON COLUMN events.event_id    IS '이벤트 고유 식별자 (ULID 기반, 28자)';
COMMENT ON COLUMN events.event_type  IS '이벤트 종류 식별 문자열 (자유 텍스트, 도메인 네임스페이스 규약 추측)';
COMMENT ON COLUMN events.actor_type  IS '행위자 종류: user / member / system';
COMMENT ON COLUMN events.actor_id    IS '행위자 ID (system 이벤트면 null 가능)';
COMMENT ON COLUMN events.target_type IS '대상 엔티티 종류: concern / proposal / order / member 등';
COMMENT ON COLUMN events.target_id   IS '대상 엔티티 ID';
COMMENT ON COLUMN events.metadata    IS '이벤트 부가 정보 (JSONB, 스키마는 event_type에 따라 다름)';
COMMENT ON COLUMN events.created_at  IS '이벤트 발생 일시';

-- ------------------------------------------------------------
-- articles
-- ------------------------------------------------------------
COMMENT ON TABLE articles IS '콘텐츠 마케팅용 아티클 (가이드/후기/뉴스/팁). Phase 1 바이럴 및 SEO 유입 전략의 핵심 — 한국어/중국어 다국어 본문을 단일 레코드에 보관. 소프트 삭제(deleted_at) 지원.';
COMMENT ON COLUMN articles.article_id      IS '아티클 고유 식별자 (ULID 기반, 28자)';
COMMENT ON COLUMN articles.slug            IS 'SEO 친화적 URL 슬러그 (고유)';
COMMENT ON COLUMN articles.status          IS '게시 상태: draft → published → archived';
COMMENT ON COLUMN articles.category        IS '카테고리: guide / review / news / tip';
COMMENT ON COLUMN articles.intent          IS '콘텐츠 목적: education / promotion / seo';
COMMENT ON COLUMN articles.title_ko        IS '제목 (한국어)';
COMMENT ON COLUMN articles.body_ko         IS '본문 (한국어, 마크다운/HTML 추측)';
COMMENT ON COLUMN articles.excerpt_ko      IS '요약/미리보기 (한국어)';
COMMENT ON COLUMN articles.title_zh        IS '제목 (중국어 번역)';
COMMENT ON COLUMN articles.body_zh         IS '본문 (중국어 번역)';
COMMENT ON COLUMN articles.excerpt_zh      IS '요약/미리보기 (중국어 번역)';
COMMENT ON COLUMN articles.cover_image_url IS '리스트/상단 노출용 커버 이미지 URL';
COMMENT ON COLUMN articles.tags            IS '태그 목록 (JSONB 배열)';
COMMENT ON COLUMN articles.body_areas      IS '관련 시술 부위 키워드 (JSONB 배열, 고민과 매칭용)';
COMMENT ON COLUMN articles.view_count      IS '조회수 누적 (성과 추적)';
COMMENT ON COLUMN articles.cta_click_count IS 'CTA 클릭수 누적 (전환 추적)';
COMMENT ON COLUMN articles.published_at    IS '최초 게시 일시 (draft 단계에서는 null)';
COMMENT ON COLUMN articles.created_at      IS '작성 일시';
COMMENT ON COLUMN articles.updated_at      IS '최종 수정 일시';
COMMENT ON COLUMN articles.deleted_at      IS '소프트 삭제 일시 (null이면 활성)';

-- ------------------------------------------------------------
-- article_images
-- ------------------------------------------------------------
COMMENT ON TABLE article_images IS '아티클 본문에 첨부되는 이미지. 대표 이미지는 articles.cover_image_url에, 본문 내 이미지는 이 테이블에 저장 (추측).';
COMMENT ON COLUMN article_images.article_image_id IS '이미지 고유 식별자 (ULID 기반, 28자)';
COMMENT ON COLUMN article_images.article_id       IS '소속 아티클 ID (articles.article_id FK)';
COMMENT ON COLUMN article_images.url              IS '이미지 파일 URL (스토리지 경로)';
COMMENT ON COLUMN article_images.alt_text         IS '이미지 대체 텍스트 (접근성/SEO 용)';
COMMENT ON COLUMN article_images.sort_order       IS '본문/갤러리 내 정렬 순서 (낮을수록 앞)';



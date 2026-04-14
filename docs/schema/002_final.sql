-- ============================================================
-- HYLIREN — Final Schema DDL v2.2
-- Date: 2026-04-13
--
-- v2.1 → v2.2 마감 사항:
--   Fix 8.  active proposal partial unique index (concern+member당 active 1개만)
--   Fix 9.  users 인증 식별자 정책 + CHECK 제약
--   Fix 10. orders↔detail 정합성 앱 레벨 검증 규칙 문서화
--   Fix 11. referral_payouts.trigger_event_id FK 연결
--   Note.   body_area는 shared constant로 단일 관리 (앱 레벨)
--   Note.   buyer_profiles→role=buyer, partner_profiles→role=partner 앱 레벨 검증
--
-- 기존 Fix 1~7 + Rule 1~13 전부 유지.
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

CREATE TYPE concern_source AS ENUM (
  'organic',
  'referral',
  'article',
  'ad',
  'direct'
);

CREATE TYPE proposal_status AS ENUM (
  'draft',
  'sent',
  'viewed',
  'shortlisted',
  'selected',
  'rejected'
);

CREATE TYPE anesthesia_type AS ENUM ('local', 'sedation', 'general');

CREATE TYPE order_type AS ENUM ('report', 'service');

CREATE TYPE order_status AS ENUM (
  'pending',
  'paid',
  'processing',
  'delivered',
  'completed',
  'cancelled',
  'refunded'
);

CREATE TYPE report_type AS ENUM ('standard', 'premium');

CREATE TYPE service_type AS ENUM (
  'schedule',
  'interpreter',
  'pickup',
  'hotel',
  'butler',
  'recovery_care',
  'tour',
  'package'
);

CREATE TYPE subscription_plan AS ENUM ('free', 'basic', 'premium');
CREATE TYPE subscription_status AS ENUM ('active', 'cancelled', 'expired');
CREATE TYPE credit_reason AS ENUM ('purchase', 'proposal_sent', 'refund', 'bonus');

CREATE TYPE article_status AS ENUM ('draft', 'published', 'archived');
CREATE TYPE article_category AS ENUM ('procedure', 'case_study', 'pricing', 'risk', 'skincare', 'trend');
-- Fix 3: intent는 ENUM 확정 (number 아님)
CREATE TYPE article_intent AS ENUM ('awareness', 'consideration', 'conversion');

CREATE TYPE event_actor_type AS ENUM ('user', 'member', 'system');
-- Fix 2: target_type도 ENUM으로 고정
CREATE TYPE event_target_type AS ENUM ('concern', 'proposal', 'order', 'article', 'user', 'member');

CREATE TYPE payout_status AS ENUM ('pending', 'approved', 'paid', 'cancelled');
CREATE TYPE payout_trigger AS ENUM ('signup', 'concern_submitted');

-- ============================================================
-- 1. USER (수요측)
--
-- Fix 9: 인증 식별자 정책
--   FO 고객(중국): phone 또는 email 중 최소 1개 필수
--   레퍼러: email 필수
--   CHECK 제약으로 DB 레벨에서 강제
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

  -- Fix 9: 최소 1개 식별자 필수 (email 또는 phone)
  CONSTRAINT chk_user_has_identifier CHECK (email IS NOT NULL OR phone IS NOT NULL)
);

COMMENT ON TABLE  users IS '수요측 사용자 (고객 + 레퍼러)';
COMMENT ON COLUMN users.id IS '사용자 고유 ID';
COMMENT ON COLUMN users.role IS '역할 (buyer=고객, referrer=레퍼러)';
COMMENT ON COLUMN users.email IS '이메일 (로그인용, 고유 — phone과 최소 1개 필수)';
COMMENT ON COLUMN users.phone IS '전화번호 (email과 최소 1개 필수 — 중국 고객은 phone 우선)';
COMMENT ON COLUMN users.password_hash IS '비밀번호 해시';
COMMENT ON COLUMN users.name IS '이름';
COMMENT ON COLUMN users.locale IS '언어 설정 (ko=한국어, zh-CN=중국어 간체)';
COMMENT ON COLUMN users.avatar_url IS '프로필 이미지 URL';
COMMENT ON COLUMN users.referral_code IS '레퍼러 본인의 추천 코드';
COMMENT ON COLUMN users.referred_by IS '추천한 레퍼러 ID';
COMMENT ON COLUMN users.created_at IS '가입일시';
COMMENT ON COLUMN users.updated_at IS '최종 수정일시';

-- Fix 1: PK = FK, NOT NULL 강제 (1:1)
CREATE TABLE buyer_profiles (
  user_id         UUID NOT NULL PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  birth_year      INT,
  gender          TEXT CHECK (gender IN ('female', 'male', 'other')),
  country         TEXT NOT NULL DEFAULT 'CN',
  city            TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE  buyer_profiles IS '고객 상세 프로필 (buyer 전용, 1:1 강제)';
COMMENT ON COLUMN buyer_profiles.user_id IS '사용자 ID (users PK/FK, NOT NULL, 1:1)';
COMMENT ON COLUMN buyer_profiles.birth_year IS '출생 연도';
COMMENT ON COLUMN buyer_profiles.gender IS '성별 (female, male, other)';
COMMENT ON COLUMN buyer_profiles.country IS '국가 코드';
COMMENT ON COLUMN buyer_profiles.city IS '도시';

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

COMMENT ON TABLE  members IS '공급측 사용자 (병원 + 관리자)';
COMMENT ON COLUMN members.id IS '멤버 고유 ID';
COMMENT ON COLUMN members.role IS '역할 (partner=병원, admin=관리자)';
COMMENT ON COLUMN members.email IS '이메일 (로그인용, 고유)';
COMMENT ON COLUMN members.password_hash IS '비밀번호 해시';
COMMENT ON COLUMN members.name IS '담당자 이름';

-- Fix 1: PK = FK, NOT NULL 강제 (1:1)
-- Fix 4: specialties는 TEXT[] (배열)
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

COMMENT ON TABLE  partner_profiles IS '병원 상세 프로필 (partner 전용, 1:1 강제)';
COMMENT ON COLUMN partner_profiles.member_id IS '멤버 ID (members PK/FK, NOT NULL, 1:1)';
COMMENT ON COLUMN partner_profiles.hospital_name IS '병원명 (한국어)';
COMMENT ON COLUMN partner_profiles.hospital_name_zh IS '병원명 (중국어)';
COMMENT ON COLUMN partner_profiles.description IS '병원 소개 (한국어)';
COMMENT ON COLUMN partner_profiles.description_zh IS '병원 소개 (중국어)';
COMMENT ON COLUMN partner_profiles.address IS '주소';
COMMENT ON COLUMN partner_profiles.phone IS '대표 전화번호';
COMMENT ON COLUMN partner_profiles.website IS '웹사이트 URL';
COMMENT ON COLUMN partner_profiles.logo_url IS '로고 이미지 URL';
COMMENT ON COLUMN partner_profiles.cover_image_url IS '커버 이미지 URL';
COMMENT ON COLUMN partner_profiles.specialties IS '진료 과목 배열 TEXT[] (눈, 코, 리프팅, 피부 등)';
COMMENT ON COLUMN partner_profiles.verified IS '인증 완료 여부';

-- Fix 1: PK = FK, NOT NULL 강제 (1:1)
CREATE TABLE credit_balances (
  member_id       UUID NOT NULL PRIMARY KEY REFERENCES members(id) ON DELETE CASCADE,
  balance         INT          NOT NULL DEFAULT 0 CHECK (balance >= 0),
  updated_at      TIMESTAMPTZ  NOT NULL DEFAULT now()
);

COMMENT ON TABLE  credit_balances IS '병원 크레딧 잔고 (1:1 강제)';
COMMENT ON COLUMN credit_balances.member_id IS '멤버 ID (members PK/FK, NOT NULL, 1:1)';
COMMENT ON COLUMN credit_balances.balance IS '현재 크레딧 잔액 (0 이상)';

CREATE TABLE credit_transactions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id       UUID         NOT NULL REFERENCES members(id),
  amount          INT          NOT NULL,
  reason          credit_reason NOT NULL,
  reference_id    UUID,
  balance_after   INT          NOT NULL,
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT now()
);

COMMENT ON TABLE  credit_transactions IS '크레딧 거래 내역';
COMMENT ON COLUMN credit_transactions.id IS '거래 고유 ID';
COMMENT ON COLUMN credit_transactions.member_id IS '멤버 ID (members FK)';
COMMENT ON COLUMN credit_transactions.amount IS '변동량 (양수=충전, 음수=차감)';
COMMENT ON COLUMN credit_transactions.reason IS '사유 (purchase=충전, proposal_sent=제안서발송, refund=환불, bonus=보너스)';
COMMENT ON COLUMN credit_transactions.reference_id IS '참조 ID (예: proposal_id)';
COMMENT ON COLUMN credit_transactions.balance_after IS '거래 후 잔액';

CREATE TABLE subscriptions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id       UUID         NOT NULL REFERENCES members(id),
  plan            subscription_plan   NOT NULL,
  status          subscription_status NOT NULL,
  started_at      TIMESTAMPTZ  NOT NULL,
  expires_at      TIMESTAMPTZ,
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT now()
);

COMMENT ON TABLE  subscriptions IS '병원 CRM 구독';
COMMENT ON COLUMN subscriptions.id IS '구독 고유 ID';
COMMENT ON COLUMN subscriptions.member_id IS '멤버 ID (members FK)';
COMMENT ON COLUMN subscriptions.plan IS '구독 플랜 (free, basic, premium)';
COMMENT ON COLUMN subscriptions.status IS '구독 상태 (active, cancelled, expired)';
COMMENT ON COLUMN subscriptions.started_at IS '구독 시작일';
COMMENT ON COLUMN subscriptions.expires_at IS '구독 만료일';

-- ============================================================
-- 3. CONCERN (고민)
-- Fix 5: budget은 KRW 만원 고정 (문서 명시)
-- Add: deleted_at soft delete
-- ============================================================

CREATE TABLE concerns (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID         NOT NULL REFERENCES users(id),
  status          concern_status NOT NULL DEFAULT 'draft',
  source          concern_source NOT NULL DEFAULT 'organic',
  body_area       TEXT         NOT NULL,
  body_area_detail TEXT,
  description     TEXT         NOT NULL,
  budget_min      INT,
  budget_max      INT,
  visit_date_from DATE,
  visit_date_to   DATE,
  has_passport    BOOLEAN      NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ  NOT NULL DEFAULT now(),
  deleted_at      TIMESTAMPTZ
);

COMMENT ON TABLE  concerns IS '성형 고민 (매칭의 입력, 1 User : N Concerns)';
COMMENT ON COLUMN concerns.id IS '고민 고유 ID';
COMMENT ON COLUMN concerns.user_id IS '작성자 ID (users FK)';
COMMENT ON COLUMN concerns.status IS '상태 (상태 전이가 전체 흐름을 결정)';
COMMENT ON COLUMN concerns.source IS '유입 경로 (organic, referral, article, ad, direct) — BO CAC/ROI 분석용';
COMMENT ON COLUMN concerns.body_area IS '고민 부위 (눈, 코, 리프팅, 피부, 다이어트, 기타)';
COMMENT ON COLUMN concerns.body_area_detail IS '상세 부위 (예: 매몰쌍꺼풀, 코끝 성형)';
COMMENT ON COLUMN concerns.description IS '고민 내용 (텍스트)';
COMMENT ON COLUMN concerns.budget_min IS '예산 하한 (KRW 만원, 플랫폼 기준 통화 KRW 고정)';
COMMENT ON COLUMN concerns.budget_max IS '예산 상한 (KRW 만원, 플랫폼 기준 통화 KRW 고정)';
COMMENT ON COLUMN concerns.visit_date_from IS '방문 예정 시작일';
COMMENT ON COLUMN concerns.visit_date_to IS '방문 예정 종료일';
COMMENT ON COLUMN concerns.has_passport IS '여권 보유 여부';
COMMENT ON COLUMN concerns.deleted_at IS '소프트 삭제 일시 (NULL=활성)';

CREATE TABLE concern_photos (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  concern_id      UUID NOT NULL REFERENCES concerns(id) ON DELETE CASCADE,
  url             TEXT NOT NULL,
  sort_order      INT  NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE  concern_photos IS '고민 첨부 사진';
COMMENT ON COLUMN concern_photos.concern_id IS '고민 ID (concerns FK)';
COMMENT ON COLUMN concern_photos.url IS '이미지 URL';
COMMENT ON COLUMN concern_photos.sort_order IS '정렬 순서';

-- ============================================================
-- 4. PROPOSAL (제안서)
--
-- Fix 5: 모든 가격 KRW 만원 고정 (currency 컬럼 불필요)
-- Fix 6: proposal_items.description은 보조 전용 (비교 핵심 정보는 proposals 고정 필드)
-- Add: deleted_at soft delete
--
-- 가격 규칙:
--   proposals.total_price = 최종 권위 값 (KRW 만원)
--   proposal_items[].price = 설명용 내역 (합계 ≠ total_price 허용)
--   proposal_items[].description = 보조 설명 전용 (비교 핵심 정보 넣지 말 것)
-- ============================================================

CREATE TABLE proposals (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  concern_id          UUID          NOT NULL REFERENCES concerns(id),
  member_id           UUID          NOT NULL REFERENCES members(id),
  version             INT           NOT NULL DEFAULT 1,
  is_active           BOOLEAN       NOT NULL DEFAULT TRUE,
  status              proposal_status NOT NULL DEFAULT 'draft',

  -- 비교 핵심 필드 (정규화 값, NOT NULL, 여기만 비교 UI + 리포트 엔진이 사용)
  total_price         INT           NOT NULL,
  recovery_days       INT           NOT NULL,
  anesthesia_type     anesthesia_type NOT NULL,
  hospital_stay_days  INT           NOT NULL DEFAULT 0,
  available_date_from DATE,
  available_date_to   DATE,

  -- 보조 필드 (유일한 free text)
  consultation_note   TEXT,

  -- 품질 관리
  quality_score       INT CHECK (quality_score >= 0 AND quality_score <= 100),
  is_flagged          BOOLEAN       NOT NULL DEFAULT FALSE,

  -- 과금
  credits_charged     INT           NOT NULL DEFAULT 0,

  sent_at             TIMESTAMPTZ,
  viewed_at           TIMESTAMPTZ,
  created_at          TIMESTAMPTZ   NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ   NOT NULL DEFAULT now(),
  deleted_at          TIMESTAMPTZ,

  CONSTRAINT uq_proposal_version UNIQUE (concern_id, member_id, version)
);

COMMENT ON TABLE  proposals IS '병원 제안서 (매칭의 출력, 버전 관리, 1 Concern : N Proposals)';
COMMENT ON COLUMN proposals.id IS '제안서 고유 ID';
COMMENT ON COLUMN proposals.concern_id IS '대상 고민 ID (concerns FK, NOT NULL)';
COMMENT ON COLUMN proposals.member_id IS '제안 병원 ID (members FK)';
COMMENT ON COLUMN proposals.version IS '버전 (수정 시 +1, 덮어쓰기 금지)';
COMMENT ON COLUMN proposals.is_active IS '활성 버전 여부 (수정 시 기존=false)';
COMMENT ON COLUMN proposals.status IS '상태 (draft→sent→viewed→shortlisted→selected/rejected)';
COMMENT ON COLUMN proposals.total_price IS '총 예상 비용 (KRW 만원, 최종 권위 값 — items는 내역)';
COMMENT ON COLUMN proposals.recovery_days IS '예상 회복 기간 (일)';
COMMENT ON COLUMN proposals.anesthesia_type IS '마취 유형 (local=부분, sedation=수면, general=전신)';
COMMENT ON COLUMN proposals.hospital_stay_days IS '입원 기간 (일, 기본 0)';
COMMENT ON COLUMN proposals.available_date_from IS '시술 가능 시작일';
COMMENT ON COLUMN proposals.available_date_to IS '시술 가능 종료일';
COMMENT ON COLUMN proposals.consultation_note IS '부연 설명 (유일한 free text 보조 필드)';
COMMENT ON COLUMN proposals.quality_score IS '품질 점수 (0-100)';
COMMENT ON COLUMN proposals.is_flagged IS '신고/저품질 플래그';
COMMENT ON COLUMN proposals.credits_charged IS '발송 시 차감된 크레딧';
COMMENT ON COLUMN proposals.sent_at IS '발송 일시';
COMMENT ON COLUMN proposals.viewed_at IS '고객 열람 일시';
COMMENT ON COLUMN proposals.deleted_at IS '소프트 삭제 일시 (NULL=활성)';

-- Fix 6: description은 보조 전용 — COMMENT로 명시
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

COMMENT ON TABLE  proposal_items IS '제안서 시술 항목 (설명용 내역, total_price가 권위 값)';
COMMENT ON COLUMN proposal_items.proposal_id IS '제안서 ID (proposals FK)';
COMMENT ON COLUMN proposal_items.treatment_name IS '시술명 (한국어)';
COMMENT ON COLUMN proposal_items.treatment_name_zh IS '시술명 (중국어)';
COMMENT ON COLUMN proposal_items.price IS '항목 가격 (KRW 만원, 설명용 — 합계≠total_price 허용)';
COMMENT ON COLUMN proposal_items.description IS '항목 설명 (보조 전용 — 비교 핵심 정보는 proposals 고정 필드에만 입력할 것)';
COMMENT ON COLUMN proposal_items.sort_order IS '정렬 순서';

CREATE TABLE proposal_images (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id     UUID NOT NULL REFERENCES proposals(id) ON DELETE CASCADE,
  url             TEXT NOT NULL,
  caption         TEXT,
  sort_order      INT  NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE  proposal_images IS '제안서 첨부 이미지 (포트폴리오 등)';
COMMENT ON COLUMN proposal_images.proposal_id IS '제안서 ID (proposals FK)';
COMMENT ON COLUMN proposal_images.url IS '이미지 URL';
COMMENT ON COLUMN proposal_images.caption IS '이미지 캡션';
COMMENT ON COLUMN proposal_images.sort_order IS '정렬 순서';

-- ============================================================
-- 5. ORDER (모든 구매의 단위)
--
-- Fix 5: currency KRW 고정 (CHECK 제약)
-- Fix 7: price는 "주문 시점 확정 금액" 스냅샷 — detail이 바뀌어도 order 가격 불변
--
-- Rule 3 계약:
--   orders.type = 'report'  → report_order_details 반드시 존재
--   orders.type = 'service' → service_order_details 반드시 존재
--   TypeScript Discriminated Union으로 컴파일 타임 강제
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

COMMENT ON TABLE  orders IS '통합 주문 (모든 구매의 단위, concern_id 필수)';
COMMENT ON COLUMN orders.id IS '주문 고유 ID';
COMMENT ON COLUMN orders.user_id IS '구매자 ID (users FK)';
COMMENT ON COLUMN orders.concern_id IS '관련 고민 ID (concerns FK, 매출↔퍼널 추적 필수)';
COMMENT ON COLUMN orders.type IS '주문 유형 (report/service — detail과 1:1 정합)';
COMMENT ON COLUMN orders.status IS '상태 (pending→paid→processing→delivered→completed/cancelled/refunded)';
COMMENT ON COLUMN orders.price IS '결제 금액 (KRW 원, 주문 시점 확정 스냅샷 — detail 변경되어도 불변)';
COMMENT ON COLUMN orders.currency IS '통화 (KRW 고정, CNY 변환은 뷰 레이어)';
COMMENT ON COLUMN orders.paid_at IS '결제 완료 일시';

-- Fix 1: PK = FK, NOT NULL (1:1)
CREATE TABLE report_order_details (
  order_id             UUID NOT NULL PRIMARY KEY REFERENCES orders(id) ON DELETE CASCADE,
  concern_id           UUID NOT NULL REFERENCES concerns(id),
  target_proposal_id   UUID REFERENCES proposals(id),
  report_type          report_type NOT NULL DEFAULT 'standard',
  overtreatment_score  INT CHECK (overtreatment_score >= 0 AND overtreatment_score <= 100),
  price_fairness_score INT CHECK (price_fairness_score >= 0 AND price_fairness_score <= 100),
  risk_score           INT CHECK (risk_score >= 0 AND risk_score <= 100),
  summary              TEXT,
  full_report_url      TEXT,
  delivered_at         TIMESTAMPTZ
);

COMMENT ON TABLE  report_order_details IS '검증 리포트 주문 상세 (orders 1:1 강제, type=report만)';
COMMENT ON COLUMN report_order_details.order_id IS '주문 ID (orders PK/FK, NOT NULL, 1:1)';
COMMENT ON COLUMN report_order_details.concern_id IS '분석 대상 고민 ID';
COMMENT ON COLUMN report_order_details.target_proposal_id IS '분석 기준 제안서 ID (proposals FK, 해당 버전 row)';
COMMENT ON COLUMN report_order_details.report_type IS '리포트 유형 (standard=기본, premium=프리미엄)';
COMMENT ON COLUMN report_order_details.overtreatment_score IS '과잉진료 점수 (0-100, 낮을수록 양호)';
COMMENT ON COLUMN report_order_details.price_fairness_score IS '가격 적정성 점수 (0-100, 높을수록 적정)';
COMMENT ON COLUMN report_order_details.risk_score IS '리스크 점수 (0-100, 낮을수록 안전)';
COMMENT ON COLUMN report_order_details.summary IS '분석 요약';
COMMENT ON COLUMN report_order_details.full_report_url IS '상세 리포트 URL';
COMMENT ON COLUMN report_order_details.delivered_at IS '리포트 제공 일시';

-- Fix 1: PK = FK, NOT NULL (1:1)
CREATE TABLE service_order_details (
  order_id        UUID NOT NULL PRIMARY KEY REFERENCES orders(id) ON DELETE CASCADE,
  service_type    service_type NOT NULL,
  service_date    DATE,
  notes           TEXT,
  confirmed_at    TIMESTAMPTZ,
  completed_at    TIMESTAMPTZ
);

COMMENT ON TABLE  service_order_details IS '실행 서비스 주문 상세 (orders 1:1 강제, type=service만)';
COMMENT ON COLUMN service_order_details.order_id IS '주문 ID (orders PK/FK, NOT NULL, 1:1)';
COMMENT ON COLUMN service_order_details.service_type IS '서비스 유형 (schedule, interpreter, pickup, hotel, butler, recovery_care, tour, package)';
COMMENT ON COLUMN service_order_details.service_date IS '서비스 제공 예정일';
COMMENT ON COLUMN service_order_details.notes IS '요청 사항';
COMMENT ON COLUMN service_order_details.confirmed_at IS '서비스 확정 일시';
COMMENT ON COLUMN service_order_details.completed_at IS '서비스 완료 일시';

CREATE TABLE service_package_items (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id        UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  service_type    service_type NOT NULL,
  price           INT  NOT NULL,
  sort_order      INT  NOT NULL DEFAULT 0
);

COMMENT ON TABLE  service_package_items IS '패키지 구성 항목 (service_type=package일 때)';
COMMENT ON COLUMN service_package_items.order_id IS '주문 ID (orders FK)';
COMMENT ON COLUMN service_package_items.service_type IS '개별 서비스 유형';
COMMENT ON COLUMN service_package_items.price IS '개별 서비스 가격 (KRW 원)';
COMMENT ON COLUMN service_package_items.sort_order IS '정렬 순서';

-- ============================================================
-- EXT. ARTICLE
-- Fix 3: intent ENUM 확정
-- Fix 4: tags TEXT[] 확정
-- Add: deleted_at soft delete
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
  body_area       TEXT,
  view_count      INT NOT NULL DEFAULT 0,
  cta_click_count INT NOT NULL DEFAULT 0,
  published_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at      TIMESTAMPTZ
);

COMMENT ON TABLE  articles IS '콘텐츠 아티클 (SEO 유입 → 고민 등록 전환 퍼널)';
COMMENT ON COLUMN articles.id IS '아티클 고유 ID';
COMMENT ON COLUMN articles.slug IS 'URL 슬러그 (고유)';
COMMENT ON COLUMN articles.status IS '상태 (draft, published, archived)';
COMMENT ON COLUMN articles.category IS '카테고리 (procedure, case_study, pricing, risk, skincare, trend)';
COMMENT ON COLUMN articles.intent IS '콘텐츠 목적 ENUM (awareness=유입, consideration=고민유도, conversion=전환)';
COMMENT ON COLUMN articles.title_ko IS '제목 (한국어)';
COMMENT ON COLUMN articles.body_ko IS '본문 (한국어, MDX)';
COMMENT ON COLUMN articles.excerpt_ko IS '요약 (한국어)';
COMMENT ON COLUMN articles.title_zh IS '제목 (중국어)';
COMMENT ON COLUMN articles.body_zh IS '본문 (중국어, MDX)';
COMMENT ON COLUMN articles.excerpt_zh IS '요약 (중국어)';
COMMENT ON COLUMN articles.cover_image_url IS '커버 이미지 URL';
COMMENT ON COLUMN articles.tags IS '태그 배열 TEXT[] (GIN 인덱스)';
COMMENT ON COLUMN articles.body_area IS '관련 부위 (concern과 연결)';
COMMENT ON COLUMN articles.view_count IS '조회수';
COMMENT ON COLUMN articles.cta_click_count IS 'CTA 클릭 수';
COMMENT ON COLUMN articles.published_at IS '발행일시';
COMMENT ON COLUMN articles.deleted_at IS '소프트 삭제 일시 (NULL=활성)';

CREATE TABLE article_images (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id      UUID NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  url             TEXT NOT NULL,
  alt_text        TEXT,
  sort_order      INT  NOT NULL DEFAULT 0
);

COMMENT ON TABLE  article_images IS '아티클 본문 이미지';
COMMENT ON COLUMN article_images.article_id IS '아티클 ID (articles FK)';
COMMENT ON COLUMN article_images.url IS '이미지 URL';
COMMENT ON COLUMN article_images.alt_text IS '대체 텍스트';
COMMENT ON COLUMN article_images.sort_order IS '정렬 순서';

-- ============================================================
-- EXT. EVENT TRACKING
-- Fix 2: target_type ENUM화
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

COMMENT ON TABLE  events IS '이벤트 트래킹 (Day 1부터 수집)';
COMMENT ON COLUMN events.id IS '이벤트 고유 ID';
COMMENT ON COLUMN events.event_type IS '이벤트 유형 (signup_completed, concern_submitted, proposal_sent 등)';
COMMENT ON COLUMN events.actor_type IS '행위자 유형 ENUM (user, member, system)';
COMMENT ON COLUMN events.actor_id IS '행위자 ID';
COMMENT ON COLUMN events.target_type IS '대상 유형 ENUM (concern, proposal, order, article, user, member)';
COMMENT ON COLUMN events.target_id IS '대상 ID';
COMMENT ON COLUMN events.metadata IS '추가 데이터 (필수: source, locale / 선택: label, value, context)';

-- ============================================================
-- EXT. REFERRAL
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

COMMENT ON TABLE  referral_payouts IS '레퍼럴 보상 지급';
COMMENT ON COLUMN referral_payouts.id IS '지급 고유 ID';
COMMENT ON COLUMN referral_payouts.referrer_id IS '레퍼러 ID (users FK)';
COMMENT ON COLUMN referral_payouts.referred_user_id IS '피추천 사용자 ID (users FK)';
COMMENT ON COLUMN referral_payouts.trigger_type IS '보상 트리거 ENUM (signup, concern_submitted — 의료 전환 연동 금지)';
COMMENT ON COLUMN referral_payouts.trigger_event_id IS '트리거 이벤트 ID (events FK, 정산 근거 추적용)';
COMMENT ON COLUMN referral_payouts.amount IS '보상 금액 (KRW 원)';
COMMENT ON COLUMN referral_payouts.status IS '지급 상태 ENUM (pending→approved→paid / cancelled)';
COMMENT ON COLUMN referral_payouts.approved_at IS '승인 일시';
COMMENT ON COLUMN referral_payouts.paid_at IS '지급 완료 일시';

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
CREATE INDEX idx_concerns_body_area ON concerns(body_area);
CREATE INDEX idx_concerns_not_deleted ON concerns(id) WHERE deleted_at IS NULL;

-- Proposal
CREATE INDEX idx_proposals_concern_id ON proposals(concern_id);
CREATE INDEX idx_proposals_member_id ON proposals(member_id);
CREATE INDEX idx_proposals_status ON proposals(status);
CREATE INDEX idx_proposals_active ON proposals(concern_id, member_id) WHERE is_active = TRUE;
-- Fix 8: 같은 concern+member 조합에서 active는 반드시 1개만
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

-- Article (GIN for arrays)
CREATE INDEX idx_articles_status ON articles(status);
CREATE INDEX idx_articles_category ON articles(category);
CREATE INDEX idx_articles_intent ON articles(intent);
CREATE INDEX idx_articles_body_area ON articles(body_area);
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

-- ============================================================
-- 통화 전략 (Fix 5 문서화)
-- ============================================================
-- 플랫폼 기준 통화: KRW (한국 원)
-- DB의 모든 가격 필드:
--   concerns.budget_min/max  → KRW 만원 (INT)
--   proposals.total_price    → KRW 만원 (INT)
--   proposal_items.price     → KRW 만원 (INT)
--   orders.price             → KRW 원 (INT)
--   service_package_items.price → KRW 원 (INT)
--   referral_payouts.amount  → KRW 원 (INT)
--
-- CNY 표시는 클라이언트/뷰 레이어에서 환율 적용하여 변환.
-- DB에는 KRW만 저장한다.
--
-- 가격 스냅샷 원칙 (Fix 7):
--   orders.price는 "주문 시점 확정 금액"이다.
--   이후 detail 테이블 값이 변경되어도 orders.price는 불변.
--   정산은 orders.price 기준으로만 한다.
--
-- ============================================================
-- 앱 레벨 검증 규칙 (DB 제약으로 불가 — 서비스 레이어 필수)
-- ============================================================
--
-- Fix 10: Order ↔ Detail 정합성 (매출 데이터 핵심)
--   orders.type = 'report'  → report_order_details 생성 필수, service_order_details 생성 금지
--   orders.type = 'service' → service_order_details 생성 필수, report_order_details 생성 금지
--   TypeScript Discriminated Union으로 컴파일 타임 강제 권장
--   위반 시 매출 리포팅 불가 → 보정 불가
--
-- Profile ↔ Role 정합성
--   buyer_profiles 생성 시 → users.role = 'buyer' 검증 필수
--   partner_profiles 생성 시 → members.role = 'partner' 검증 필수
--   위반 시 referrer에 buyer_profile 붙거나 admin에 partner_profile 붙는 사고
--
-- body_area 정규화
--   concerns.body_area, articles.body_area, partner_profiles.specialties[]
--   모두 동일한 shared constant에서 값을 가져와야 함
--   허용 값: '눈', '코', '리프팅', '피부', '다이어트', '기타'
--   표기 흔들리면 검색/필터/추천 전체 붕괴
-- ============================================================

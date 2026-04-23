// ============================================================
// HYLIREN — Shared Constants & Enums
// docs/schema/final.sql v2.2 정본 기준, 단일 관리
// apps/ 안에서 이 값들을 재정의하지 말 것
//
// 원칙:
//   - DB 의 PostgreSQL ENUM 과 FO 의 shared enum 은 1:1 대응한다.
//   - UI 전용 파생 상태는 *_UI_* 로 접미어 구분하여 별도 선언.
//   - 현재 PROPOSAL_STATUSES, CONCERN_STATUSES 는 UI 전용 확장을 남겨두었으며
//     추후 PR 에서 *_DB_* / *_UI_* 로 분리 예정.
// ============================================================

// --- Identity (DB: user_role, member_role) ---

// DB: user_role AS ENUM ('buyer', 'admin')
export const USER_ROLES = ['buyer', 'admin'] as const;
export type UserRole = typeof USER_ROLES[number];

// DB: member_role AS ENUM ('partner', 'admin')
export const MEMBER_ROLES = ['partner', 'admin'] as const;
export type MemberRole = typeof MEMBER_ROLES[number];

// --- Concern ---

// 현재 UI 파생 상태까지 포함된 확장 enum — PR-A2 에서 DB/UI 분리 예정.
// DB (concern_status) 는 draft/submitted/closed 3개. mapper 가 proposalCount·
// selectedHospital 조합으로 UI 상태를 파생한다.
export const CONCERN_STATUSES = [
  'draft',
  'submitted',
  'proposal_received',
  'comparing',
  'report_purchased',
  'hospital_selected',
  'service_purchased',
  'completed',
  'cancelled',
] as const;
export type ConcernStatus = typeof CONCERN_STATUSES[number];

// DB: concern_source AS ENUM ('organic', 'referral', 'campaign')
// 이전 FO 값 article/ad/direct 는 campaign 으로 통합.
export const CONCERN_SOURCES = ['organic', 'referral', 'campaign'] as const;
export type ConcernSource = typeof CONCERN_SOURCES[number];

// --- Proposal ---

// 현재 UI 전용 값 (viewed/shortlisted/selected) 과 DB 값 (accepted/expired) 공존.
// PR-A2 에서 정리 예정. mapper.ts 의 toWireStatus / fromWireStatus 가 매개 중.
export const PROPOSAL_STATUSES = [
  'draft',
  'sent',
  'viewed',
  'shortlisted',
  'selected',
  'rejected',
  'accepted',  // DB 값 — selected 와 등가
  'expired',   // DB 값 — 유효기간 만료
] as const;
export type ProposalStatus = typeof PROPOSAL_STATUSES[number];

// DB: anesthesia_type AS ENUM ('local', 'sedation', 'general')
export const ANESTHESIA_TYPES = ['local', 'sedation', 'general'] as const;
export type AnesthesiaType = typeof ANESTHESIA_TYPES[number];

// --- Order (DB: order_type, order_status) ---

export const ORDER_TYPES = ['report', 'service'] as const;
export type OrderType = typeof ORDER_TYPES[number];

// DB: order_status AS ENUM ('pending', 'paid', 'cancelled', 'refunded')
// 이전 FO 확장 값 (processing/delivered/completed) 은 타임스탬프 컬럼
// (paid_at, delivered_at, completed_at) 으로 표현하는 게 DB 설계 원칙.
export const ORDER_STATUSES = ['pending', 'paid', 'cancelled', 'refunded'] as const;
export type OrderStatus = typeof ORDER_STATUSES[number];

// DB: report_type AS ENUM ('standard', 'premium')
export const REPORT_TYPES = ['standard', 'premium'] as const;
export type ReportType = typeof REPORT_TYPES[number];

// DB: report_scope AS ENUM ('single', 'multi')
export const REPORT_SCOPES = ['single', 'multi'] as const;
export type ReportScope = typeof REPORT_SCOPES[number];

// DB: service_type AS ENUM ('translation', 'escort', 'accommodation', 'transport')
// 이전 FO 확장 (schedule/interpreter/pickup/hotel/butler/recovery_care/tour/package) 는
// Wave 3 사업 정책 결정 후 재확장 예정. 현재는 DB 4개 값만 유지.
export const SERVICE_TYPES = ['translation', 'escort', 'accommodation', 'transport'] as const;
export type ServiceType = typeof SERVICE_TYPES[number];

// --- Subscription (DB: subscription_plan, subscription_status) ---

// DB: ('basic', 'pro', 'enterprise')
export const SUBSCRIPTION_PLANS = ['basic', 'pro', 'enterprise'] as const;
export type SubscriptionPlan = typeof SUBSCRIPTION_PLANS[number];

export const SUBSCRIPTION_STATUSES = ['active', 'expired', 'cancelled'] as const;
export type SubscriptionStatus = typeof SUBSCRIPTION_STATUSES[number];

// --- Credit (DB: credit_reason) ---

// DB: ('purchase', 'refund', 'proposal_send', 'subscription_grant', 'admin_adjust')
// 이전 FO proposal_sent → proposal_send 로 개명, bonus 제거,
// subscription_grant / admin_adjust 추가.
export const CREDIT_REASONS = [
  'purchase',
  'refund',
  'proposal_send',
  'subscription_grant',
  'admin_adjust',
] as const;
export type CreditReason = typeof CREDIT_REASONS[number];

// --- Article (DB: article_status, article_category, article_intent) ---

export const ARTICLE_STATUSES = ['draft', 'published', 'archived'] as const;
export type ArticleStatus = typeof ARTICLE_STATUSES[number];

// DB: ('guide', 'review', 'news', 'tip')
// 이전 FO procedure/case_study/pricing/risk/skincare/trend 는 DB 정본 기준으로 교체.
// static articles-data.ts 의 category 값도 이 4개로 재분류 필요.
export const ARTICLE_CATEGORIES = ['guide', 'review', 'news', 'tip'] as const;
export type ArticleCategory = typeof ARTICLE_CATEGORIES[number];

// DB: ('education', 'promotion', 'seo')
// 이전 FO awareness/consideration/conversion 은 콘텐츠 목적 관점의 DB 값으로 교체.
export const ARTICLE_INTENTS = ['education', 'promotion', 'seo'] as const;
export type ArticleIntent = typeof ARTICLE_INTENTS[number];

// --- Event (DB: event_actor_type, event_target_type) ---

// DB: event_actor_type AS ENUM ('user', 'member', 'system')
// 이전 FO 의 'partner' / 'admin' 은 모두 'member' 로 통합됨.
// (DB 에서 partner/admin 은 members 테이블의 role 로 구분됨)
export const EVENT_ACTOR_TYPES = ['user', 'member', 'system'] as const;
export type EventActorType = typeof EVENT_ACTOR_TYPES[number];

// DB: event_target_type AS ENUM ('concern', 'proposal', 'order', 'member')
// 이전 FO 의 'article', 'user' 는 제거됨.
// article/user 를 대상으로 하는 이벤트는 metadata.articleId / metadata.userId 로 우회.
export const EVENT_TARGET_TYPES = ['concern', 'proposal', 'order', 'member'] as const;
export type EventTargetType = typeof EVENT_TARGET_TYPES[number];

// --- Referral (DB: payout_status, payout_trigger) ---

// DB: payout_status AS ENUM ('pending', 'approved', 'paid', 'rejected')
// 이전 FO 의 'cancelled' 는 DB 'rejected' 로 통일.
export const PAYOUT_STATUSES = ['pending', 'approved', 'paid', 'rejected'] as const;
export type PayoutStatus = typeof PAYOUT_STATUSES[number];

// DB: payout_trigger AS ENUM ('signup', 'first_order', 'subscription')
// 이전 FO 의 'concern_submitted' 제거. first_order / subscription 추가.
export const PAYOUT_TRIGGERS = ['signup', 'first_order', 'subscription'] as const;
export type PayoutTrigger = typeof PAYOUT_TRIGGERS[number];

// --- Body Area (DB: concerns.primary_area VARCHAR(50), body_areas JSONB) ---

// DB 는 enum 이 아닌 자유 문자열이지만, FO UI 표시 일관성을 위해 enum 으로 제약.
// mapper.ts 의 toBodyArea() 가 DB 에 저장된 unknown 값을 '기타' 로 정규화한다.
export const BODY_AREAS = ['눈', '코', '리프팅', '피부', '다이어트', '기타'] as const;
export type BodyArea = typeof BODY_AREAS[number];

// --- Locale (DB: users.locale VARCHAR(10) DEFAULT 'zh-CN') ---

export const LOCALES = ['ko', 'zh-CN'] as const;
export type Locale = typeof LOCALES[number];

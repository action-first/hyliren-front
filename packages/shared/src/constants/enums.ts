// ============================================================
// HYLIREN — Shared Constants & Enums
// schema 002_final.sql v2.2 기준, 단일 관리
// apps/ 안에서 이 값들을 재정의하지 말 것
// ============================================================

// --- Identity ---

export const USER_ROLES = ['buyer', 'referrer'] as const;
export type UserRole = typeof USER_ROLES[number];

export const MEMBER_ROLES = ['partner', 'admin'] as const;
export type MemberRole = typeof MEMBER_ROLES[number];

// --- Concern ---

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

export const CONCERN_SOURCES = ['organic', 'referral', 'article', 'ad', 'direct'] as const;
export type ConcernSource = typeof CONCERN_SOURCES[number];

// --- Proposal ---

export const PROPOSAL_STATUSES = [
  'draft',
  'sent',
  'viewed',
  'shortlisted',
  'selected',
  'rejected',
] as const;
export type ProposalStatus = typeof PROPOSAL_STATUSES[number];

export const ANESTHESIA_TYPES = ['local', 'sedation', 'general'] as const;
export type AnesthesiaType = typeof ANESTHESIA_TYPES[number];

// --- Order ---

export const ORDER_TYPES = ['report', 'service'] as const;
export type OrderType = typeof ORDER_TYPES[number];

export const ORDER_STATUSES = [
  'pending',
  'paid',
  'processing',
  'delivered',
  'completed',
  'cancelled',
  'refunded',
] as const;
export type OrderStatus = typeof ORDER_STATUSES[number];

export const REPORT_TYPES = ['standard', 'premium'] as const;
export type ReportType = typeof REPORT_TYPES[number];

export const SERVICE_TYPES = [
  'schedule',
  'interpreter',
  'pickup',
  'hotel',
  'butler',
  'recovery_care',
  'tour',
  'package',
] as const;
export type ServiceType = typeof SERVICE_TYPES[number];

// --- Subscription ---

export const SUBSCRIPTION_PLANS = ['free', 'basic', 'premium'] as const;
export type SubscriptionPlan = typeof SUBSCRIPTION_PLANS[number];

export const SUBSCRIPTION_STATUSES = ['active', 'cancelled', 'expired'] as const;
export type SubscriptionStatus = typeof SUBSCRIPTION_STATUSES[number];

// --- Credit ---

export const CREDIT_REASONS = ['purchase', 'proposal_sent', 'refund', 'bonus'] as const;
export type CreditReason = typeof CREDIT_REASONS[number];

// --- Article ---

export const ARTICLE_STATUSES = ['draft', 'published', 'archived'] as const;
export type ArticleStatus = typeof ARTICLE_STATUSES[number];

export const ARTICLE_CATEGORIES = [
  'procedure',
  'case_study',
  'pricing',
  'risk',
  'skincare',
  'trend',
] as const;
export type ArticleCategory = typeof ARTICLE_CATEGORIES[number];

export const ARTICLE_INTENTS = ['awareness', 'consideration', 'conversion'] as const;
export type ArticleIntent = typeof ARTICLE_INTENTS[number];

// --- Event ---

export const EVENT_ACTOR_TYPES = ['user', 'member', 'system'] as const;
export type EventActorType = typeof EVENT_ACTOR_TYPES[number];

export const EVENT_TARGET_TYPES = [
  'concern',
  'proposal',
  'order',
  'article',
  'user',
  'member',
] as const;
export type EventTargetType = typeof EVENT_TARGET_TYPES[number];

// --- Referral ---

export const PAYOUT_STATUSES = ['pending', 'approved', 'paid', 'cancelled'] as const;
export type PayoutStatus = typeof PAYOUT_STATUSES[number];

export const PAYOUT_TRIGGERS = ['signup', 'concern_submitted'] as const;
export type PayoutTrigger = typeof PAYOUT_TRIGGERS[number];

// --- Body Area (shared across concern, article, partner_profile) ---

export const BODY_AREAS = ['눈', '코', '리프팅', '피부', '다이어트', '기타'] as const;
export type BodyArea = typeof BODY_AREAS[number];

// --- Locale ---

export const LOCALES = ['ko', 'zh-CN'] as const;
export type Locale = typeof LOCALES[number];

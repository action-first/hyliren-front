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

// 정책 (i18n QA Stage 3):
//   - DB/wire shape 는 stable enum key (skin/lifting/eyes/diet/nose/etc)
//   - 한국어 표시 라벨은 i18n 메시지 키 common.bodyArea.{key} 로 분리
//   - mapper.ts 의 toBodyArea() 가 DB 에 저장된 unknown 값을 'etc' 로 정규화
//
// 노출 순서 정책 (2026-05-11 biz-target shift):
//   외국인 방한 의료관광 통계 — 피부 시술 75% / 리프팅 디바이스 / 다이어트 / 수술(쌍꺼풀·코) 12%.
//   타겟 = 20-30대 여성. UI enumerate 시 high-volume 카테고리(skin/lifting) 가 앞에 오도록 재배치.
//   DB enum 값 집합은 unchanged — UI 노출 순서만 영향 (PO 시술 등록 wizard 등).
export const BODY_AREAS = ['skin', 'lifting', 'eyes', 'diet', 'nose', 'etc'] as const;
export type BodyArea = typeof BODY_AREAS[number];

/** i18n 키 prefix — t(`common.bodyArea.${area}`) 로 표시 라벨 매핑. */
export const BODY_AREA_LABEL_KEY_PREFIX = 'common.bodyArea';

export function bodyAreaLabelKey(area: BodyArea | string): string {
  return `${BODY_AREA_LABEL_KEY_PREFIX}.${area}`;
}

// --- Locale (DB: users.locale VARCHAR(10) DEFAULT 'zh-CN') ---

// BCP 47 규격 (ko/ja/en 은 2글자), 중국어는 간체/번체 구분 위해 예외적으로 zh-CN.
// 향후 zh-TW, vi, th 등 확장 시 이 배열에만 추가.
export const LOCALES = ['ko', 'zh-CN', 'ja', 'en'] as const;
export type Locale = typeof LOCALES[number];

/** 서비스 기본 소스 언어 — 모든 원본 콘텐츠의 기준. */
export const DEFAULT_SOURCE_LOCALE: Locale = 'ko';

export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && (LOCALES as readonly string[]).includes(value);
}

/**
 * 임의 string 을 Locale 로 좁힘. 미지원 값은 fallback (기본 'ko').
 *
 * 호출처별 fallback:
 *   - Customer (FO): 'zh-CN' — 중국 의료관광 고객 주력
 *   - Partner (PO):  'ko'    — 한국 병원
 *   - Admin (BO):    'ko'    — 한국 운영자
 */
export function narrowLocale(value: unknown, fallback: Locale = 'ko'): Locale {
  return isLocale(value) ? value : fallback;
}

// --- Procedure (DB: procedure_type, procedure_status) ---
// FO 시술 상세페이지 / PO 시술 등록 페이지에서 사용하는 시술 유형.
// enum 으로 고정 (자유 문자열 사용 시 나중에 정규화 마이그레이션 비용이 큼).
// BodyArea 와는 N:1 — procedure_type 은 primary_area 와 함께 저장되어 필터·분류에 사용.
export const PROCEDURE_TYPES = [
  // 눈 (7)
  'eye_double_eyelid',        // 쌍꺼풀
  'eye_ptosis_correction',    // 눈매교정 · 안검하수
  'eye_under_eye_fat',        // 눈밑지방 재배치
  'eye_lower_blepharoplasty', // 하안검
  'eye_epicanthoplasty',      // 앞트임 / 뒤트임
  'eye_canthoplasty',         // 외안각 성형
  'eye_revision',             // 눈 재수술

  // 코 (6)
  'nose_augmentation',        // 융비 · 콧대 성형
  'nose_tip',                 // 코끝 성형
  'nose_revision',            // 코 재수술
  'nose_hump',                // 매부리코
  'nose_short_correction',    // 짧은 코 교정
  'nose_nostril',             // 콧볼 축소

  // 리프팅 · 안면윤곽 (8)
  'lift_thread',              // 실리프팅
  'lift_ulthera',             // 울쎄라
  'lift_hifu',                // HIFU
  'lift_face_lift',           // 안면거상술
  'lift_fat_graft',           // 지방이식
  'contour_facial',           // 안면윤곽 (광대)
  'contour_mandible',         // 양악
  'contour_chin',             // 턱끝 (심미턱 · 무턱 · 주걱턱)

  // 피부 (6)
  'skin_laser',               // 레이저 토닝 · 프락셀 · 피코
  'skin_injection',           // 주사 (보톡스 · 필러 · 스킨부스터)
  'skin_peeling',             // 필링
  'skin_acne',                // 여드름 치료
  'skin_pigmentation',        // 색소 · 잡티
  'skin_scar',                // 흉터 치료

  // 다이어트 (3)
  'diet_liposuction',         // 지방흡입
  'diet_injection',           // 지방분해주사
  'diet_body_contouring',     // 바디 윤곽 (비수술)

  // 기타 (1)
  'other',
] as const;
export type ProcedureType = typeof PROCEDURE_TYPES[number];

/**
 * ProcedureType → BodyArea 매핑.
 *
 * prefix(eye_, nose_, ...) 만으로 추론도 가능하지만 명시적 map 이 더 안전:
 * - 신규 시술 추가 시 area 를 반드시 지정해야 TS 체크 걸림
 * - 리프팅·안면윤곽 처럼 prefix ≠ area 인 케이스를 한눈에 파악
 */
export const PROCEDURE_TYPE_AREAS: Record<ProcedureType, BodyArea> = {
  // 눈
  eye_double_eyelid: 'eyes',
  eye_ptosis_correction: 'eyes',
  eye_under_eye_fat: 'eyes',
  eye_lower_blepharoplasty: 'eyes',
  eye_epicanthoplasty: 'eyes',
  eye_canthoplasty: 'eyes',
  eye_revision: 'eyes',

  // 코
  nose_augmentation: 'nose',
  nose_tip: 'nose',
  nose_revision: 'nose',
  nose_hump: 'nose',
  nose_short_correction: 'nose',
  nose_nostril: 'nose',

  // 리프팅 (안면윤곽 포함 — enum 상 area 로 '안면윤곽' 이 없음)
  lift_thread: 'lifting',
  lift_ulthera: 'lifting',
  lift_hifu: 'lifting',
  lift_face_lift: 'lifting',
  lift_fat_graft: 'lifting',
  contour_facial: 'lifting',
  contour_mandible: 'lifting',
  contour_chin: 'lifting',

  // 피부
  skin_laser: 'skin',
  skin_injection: 'skin',
  skin_peeling: 'skin',
  skin_acne: 'skin',
  skin_pigmentation: 'skin',
  skin_scar: 'skin',

  // 다이어트
  diet_liposuction: 'diet',
  diet_injection: 'diet',
  diet_body_contouring: 'diet',

  // 기타
  other: 'etc',
};

/** 특정 body area 에 속하는 procedure type 목록. wizard drill-down·필터 UI 용. */
export function proceduresByArea(area: BodyArea): ProcedureType[] {
  return PROCEDURE_TYPES.filter(t => PROCEDURE_TYPE_AREAS[t] === area);
}

// DB: procedure_status AS ENUM ('draft', 'published', 'archived')
// 런칭 전 단계에서는 'pending_review' / 'rejected' 미포함 — 심사 파이프라인 활성화 시 확장 예정.
export const PROCEDURE_STATUSES = ['draft', 'published', 'archived'] as const;
export type ProcedureStatus = typeof PROCEDURE_STATUSES[number];

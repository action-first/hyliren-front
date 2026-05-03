// ============================================================
// HYLIREN — 공통 Display 상수
// BO/PO 리스트 페이지에서 공통으로 사용하는 라벨, 뱃지 색상 매핑
// ============================================================

// ── 비즈니스 상수 ──
/** 제안서 1건 발송 시 차감 크레딧 */
export const CREDIT_COST = 3;

/** @unit KRW 원. 화면 입력/표시는 만원 단위를 쓰며 API/DB wire 값은 원 단위다. */
export const PRICE_MAN_UNIT = 10000;

export function manToKrw(value: number): number {
  return Math.round(value * PRICE_MAN_UNIT);
}

export function krwToMan(value: number): number {
  return Math.round(value / PRICE_MAN_UNIT);
}

/**
 * KRW 원 → 만원 표기 + 만원 라벨.
 * 만원 라벨이 한국어 raw — 호출처가 다국어 라벨이 필요하면 별도 처리.
 * (BO/PO 운영자 페이지 한국어 운영 한정 default. 다국어 페이지 확장 시 i18n key 사용 권장.)
 *
 * locale 인자: toLocaleString 의 콤마 포맷 로케일. 누락 시 'ko-KR' default (BO 한국어).
 * PO 와 같이 다국어 운영자 화면에서는 활성 locale 명시.
 */
export function formatKrwAsMan(value: number, locale: string = 'ko-KR'): string {
  return `${krwToMan(value).toLocaleString(locale)}만원`;
}

/**
 * 입력 콤마 포맷 — input 표시용.
 * 0 또는 음수면 빈 문자열 (placeholder 노출).
 *
 * locale 인자: 누락 시 'ko-KR' default. PO/FO 다국어 입력 필드는 활성 locale 명시.
 */
export function formatNumberWithComma(value: number, locale: string = 'ko-KR'): string {
  return value > 0 ? value.toLocaleString(locale) : '';
}

/** 콤마/non-digit 제거 후 number. 빈 입력은 0. */
export function parseNumberFromInput(s: string): number {
  const digits = s.replace(/[^\d]/g, '');
  return digits ? parseInt(digits, 10) : 0;
}

// ── 뱃지 색상 타입 ──
export interface BadgeColor {
  bg: string;
  text: string;
}

// ── 고민 상태 한글 라벨 ──
export const CONCERN_STATUS_KR: Record<string, string> = {
  draft: '임시저장',
  submitted: '접수됨',
  proposal_received: '제안 도착',
  comparing: '비교 중',
  report_purchased: '리포트 구매',
  hospital_selected: '병원 선택',
  service_purchased: '서비스 구매',
  completed: '완료',
  cancelled: '취소',
};

// ── 고민 상태 뱃지 색상 ──
export const CONCERN_STATUS_BADGE: Record<string, BadgeColor> = {
  '임시저장':     { bg: '#f3f4f6', text: '#6b7280' },
  '접수됨':       { bg: '#f3f4f6', text: '#374151' },
  '제안 대기':    { bg: '#fef9c3', text: '#854d0e' },
  '제안 도착':    { bg: '#dbeafe', text: '#1e40af' },
  '비교 중':      { bg: '#e0e7ff', text: '#3730a3' },
  '리포트 구매':  { bg: '#fce7f3', text: '#9d174d' },
  '병원 선택':    { bg: '#dcfce7', text: '#166534' },
  '서비스 구매':  { bg: '#d1fae5', text: '#047857' },
  '완료':         { bg: '#f0fdf4', text: '#15803d' },
  '취소':         { bg: '#fef2f2', text: '#991b1b' },
};

// ── 제안서 상태 한글 라벨 ──
// accepted == selected (DB/UI 동등, proposal-status.ts isProposalAccepted 참고)
// expired  — DB 유효기간 만료
export const PROPOSAL_STATUS_KR: Record<string, string> = {
  draft: '임시저장',
  sent: '발송',
  viewed: '열람',
  shortlisted: '후보',
  selected: '선택됨',
  accepted: '선택됨',
  rejected: '거절',
  expired: '만료',
};

// ── 제안서 상태 뱃지 색상 ──
export const PROPOSAL_STATUS_BADGE: Record<string, BadgeColor> = {
  '임시저장': { bg: '#f3f4f6', text: '#6b7280' },
  '발송':     { bg: '#f3f4f6', text: '#374151' },
  '열람':     { bg: '#fef9c3', text: '#854d0e' },
  '후보':     { bg: '#dbeafe', text: '#1e40af' },
  '선택됨':   { bg: '#dcfce7', text: '#166534' },
  '거절':     { bg: '#fef2f2', text: '#991b1b' },
  '만료':     { bg: '#f3f4f6', text: '#6b7280' },
};

// ── 마취 유형 한글 라벨 ──
export const ANESTHESIA_KR: Record<string, string> = {
  local: '부분마취',
  sedation: '수면마취',
  general: '전신마취',
};

// ── 부위 dot 색상 (AG Grid 경량 표시용) ──
// key 는 BodyArea enum (eyes/nose/...) — i18n QA Stage 3 정렬.
export const BODY_AREA_DOT: Record<string, string> = {
  eyes: '#3b82f6', nose: '#ec4899', lifting: '#8b5cf6',
  skin: '#10b981', diet: '#f59e0b', etc: '#94a3b8',
  all: '#64748b',
};

// ── 부위 뱃지 색상 (상세 페이지용) ──
export const BODY_AREA_BADGE: Record<string, BadgeColor> = {
  eyes:    { bg: '#dbeafe', text: '#1d4ed8' },
  nose:    { bg: '#fce7f3', text: '#be185d' },
  lifting: { bg: '#ede9fe', text: '#6d28d9' },
  skin:    { bg: '#d1fae5', text: '#047857' },
  diet:    { bg: '#fef3c7', text: '#b45309' },
  etc:     { bg: '#f3f4f6', text: '#4b5563' },
};

// ── 주문 상태 한글 라벨 ──
export const ORDER_STATUS_KR: Record<string, string> = {
  pending: '대기',
  paid: '결제 완료',
  processing: '처리 중',
  delivered: '전달 완료',
  completed: '완료',
  cancelled: '취소',
  refunded: '환불',
};

// ── 아티클 상태 한글 라벨 ──
export const ARTICLE_STATUS_KR: Record<string, string> = {
  draft: '초안',
  published: '게시',
  archived: '보관',
};

// ── 아티클 카테고리 한글 라벨 ──
export const ARTICLE_CATEGORY_KR: Record<string, string> = {
  procedure: '시술 정보',
  case_study: '사례',
  pricing: '비용 가이드',
  risk: '주의사항',
  skincare: '피부관리',
  trend: '트렌드',
};

// ── 날짜 포맷 유틸 ──
export function formatDateKR(dateStr: string | Date | undefined | null): string {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('ko');
}

export function formatDateRange(from: string | undefined | null, to: string | undefined | null): string {
  if (!from) return '미정';
  const f = from.slice(5);
  const t = to ? to.slice(5) : '';
  return t ? `${f} ~ ${t}` : f;
}

// ── 예산 포맷 ──
export function formatBudget(min: number | null | undefined, max: number | null | undefined): string {
  if (min == null && max == null) return '-';
  return `${min ?? 0}~${max ?? 0}만`;
}

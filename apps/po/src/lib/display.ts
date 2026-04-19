/**
 * PO 전역 표시용 상수 — 여러 페이지에서 공통으로 사용
 */

/** 제안서 1건 발송 시 차감 크레딧 */
export const CREDIT_COST = 3;

/** 마취 유형 한글 라벨 */
export const ANESTHESIA_KR: Record<string, string> = {
  local: '부분마취',
  sedation: '수면마취',
  general: '전신마취',
};

/** 제안서 상태 한글 라벨 */
export const STATUS_KR: Record<string, string> = {
  selected: '선택됨',
  shortlisted: '후보',
  rejected: '거절',
  viewed: '열람',
  sent: '발송',
  draft: '임시저장',
};

/** 제안서 상태 → Badge variant 매핑 */
export const STATUS_VARIANT: Record<string, 'success' | 'info' | 'danger' | 'warning' | 'default'> = {
  selected: 'success',
  shortlisted: 'info',
  rejected: 'danger',
  viewed: 'warning',
  sent: 'default',
  draft: 'default',
};

/** 고민 상태 한글 라벨 */
export const CONCERN_STATUS_KR: Record<string, string> = {
  submitted: '접수됨',
  proposal_received: '제안 수신',
  in_progress: '진행 중',
  completed: '완료',
  cancelled: '취소',
};

import { ApiError } from './errors';

/**
 * BE 에러 → 사용자 친화 한글 문구 매핑.
 *
 * 우선순위 (높음 → 낮음):
 * 1. ENGLISH_MSG_TO_KR — BE 영문 메시지 직접 매핑
 * 2. CODE_TO_KR — error.code (BE 가 코드 보낼 때)
 * 3. 한글 감지 — BE 메시지가 이미 한글이면 그대로 노출
 * 4. STATUS_TO_KR — HTTP status 별 일반 안내
 * 5. fallback — 호출자가 지정한 컨텍스트 메시지
 *
 * 사용:
 *   catch (e) { showToast(toUserMessage(e, '저장에 실패했습니다'), 'error'); }
 */

/** BE 가 throw 한 영문 메시지 직접 매핑. 발견 시 추가. */
const ENGLISH_MSG_TO_KR: Record<string, string> = {
  // Concern
  'Concern not found': '고민을 찾을 수 없습니다.',
  // Procedure
  'Procedure not found': '시술을 찾을 수 없습니다.',
  'Procedure disappeared after update': '시술 정보 갱신 중 오류가 발생했습니다. 새로고침 후 다시 시도해주세요.',
  'Variant not found': '시술 옵션을 찾을 수 없습니다.',
  // Auth
  'Partner access required': '병원 파트너 권한이 필요합니다.',
  // Network / 일반
  'Network error': '인터넷 연결을 확인해주세요.',
  'UNAUTHORIZED': '로그인이 만료되었어요. 다시 로그인해주세요.',
  'Session expired': '세션이 만료되었습니다. 다시 로그인해주세요.',
};

/** BE 가 error.code 보낼 때 매핑. 현재 backend 가 status code 만 사용해 사용 빈도 낮음. */
const CODE_TO_KR: Record<string, string> = {
  NETWORK: '인터넷 연결을 확인해주세요.',
  UNAUTHORIZED: '로그인이 만료되었어요. 다시 로그인해주세요.',
  CREDIT_INSUFFICIENT: '크레딧이 부족합니다. 충전 후 다시 시도해주세요.',
};

/** HTTP status 별 일반 안내 — BE 메시지 매핑 없을 때 fallback. */
const STATUS_TO_KR: Record<number, string> = {
  0: '인터넷 연결을 확인해주세요.',
  401: '로그인이 만료되었어요. 다시 로그인해주세요.',
  403: '이 작업을 수행할 권한이 없습니다.',
  404: '찾을 수 없는 항목입니다. 새로고침 후 다시 확인해주세요.',
  409: '이미 처리된 작업이거나 다른 사용자와 충돌이 발생했어요.',
  413: '파일이 너무 큽니다.',
  429: '요청이 너무 많아요. 잠시 후 다시 시도해주세요.',
  500: '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
  502: '일시적인 서버 문제가 발생했습니다. 잠시 후 다시 시도해주세요.',
  503: '서비스 점검 중입니다. 잠시 후 다시 시도해주세요.',
  504: '응답 대기 시간이 초과됐어요. 다시 시도해주세요.',
};

const HANGUL_REGEX = /[ㄱ-힝]/;

/**
 * 에러 → 사용자 친화 한글 메시지 변환.
 *
 * @param err catch 블록의 unknown 에러
 * @param fallback 컨텍스트 안내 문구 (예: '저장에 실패했습니다')
 */
export function toUserMessage(err: unknown, fallback = '오류가 발생했습니다.'): string {
  if (err instanceof ApiError) {
    // 1. 영문 메시지 직접 매핑
    const mapped = ENGLISH_MSG_TO_KR[err.message];
    if (mapped) return mapped;

    // 2. code 매핑
    const codeMapped = CODE_TO_KR[err.code];
    if (codeMapped) return codeMapped;

    // 3. 한글 메시지면 그대로 (BE 가 이미 친화 문구 직접 노출)
    if (HANGUL_REGEX.test(err.message)) return err.message;

    // 4. status 별 fallback
    const statusMapped = STATUS_TO_KR[err.status];
    if (statusMapped) return statusMapped;

    // 5. 어떤 매핑도 안되면 BE 메시지 그대로 (있으면) / fallback
    return err.message || fallback;
  }

  if (err instanceof Error) {
    const mapped = ENGLISH_MSG_TO_KR[err.message];
    if (mapped) return mapped;
    if (HANGUL_REGEX.test(err.message)) return err.message;
    return fallback;
  }

  return fallback;
}

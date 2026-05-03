import { ApiError } from './errors';

type TFn = (key: string, params?: Record<string, string | number>) => string;

/**
 * BE 에러 → 사용자 친화 다국어 메시지 변환.
 *
 * 우선순위 (높음 → 낮음):
 * 1. ApiError.code 가 ERR_* prefix → t('error.<code>') 매핑
 * 2. ENGLISH_MSG_TO_I18N — BE 영문 메시지 → i18n key 매핑
 * 3. STATUS_TO_I18N — HTTP status 별 일반 안내
 * 4. 한글 감지 — BE 메시지가 이미 한글이면 (legacy) 그대로 노출
 * 5. fallback — 호출자가 지정한 컨텍스트 메시지
 *
 * 사용:
 *   catch (e) { showToast(toUserMessage(e, t('po.saveFailFallback'), t), 'error'); }
 */

/** BE 가 throw 한 영문 메시지 → i18n key. ERR_* code 미적용 legacy. */
const ENGLISH_MSG_TO_I18N: Record<string, string> = {
  'Concern not found': 'error.ERR_CONCERN_NOT_FOUND',
  'Procedure not found': 'error.ERR_PROCEDURE_NOT_FOUND',
  'Procedure disappeared after update': 'error.ERR_PROCEDURE_STALE',
  'Variant not found': 'error.ERR_VARIANT_NOT_FOUND',
  'Partner access required': 'error.ERR_PARTNER_ACCESS_REQUIRED',
  'Network error': 'error.ERR_NETWORK',
  'UNAUTHORIZED': 'error.ERR_SESSION_EXPIRED',
  'Session expired': 'error.ERR_SESSION_EXPIRED',
};

/** HTTP status 별 일반 안내 i18n key — BE 메시지 매핑 없을 때 fallback. */
const STATUS_TO_I18N: Record<number, string> = {
  0: 'error.ERR_NETWORK',
  401: 'error.ERR_SESSION_EXPIRED',
  403: 'error.ERR_FORBIDDEN',
  404: 'error.ERR_NOT_FOUND_GENERIC',
  409: 'error.ERR_CONFLICT_GENERIC',
  413: 'error.ERR_FILE_TOO_LARGE',
  429: 'error.ERR_RATE_LIMITED',
  500: 'error.ERR_SERVER',
  502: 'error.ERR_SERVER_TEMP',
  503: 'error.ERR_SERVICE_UNAVAILABLE',
  504: 'error.ERR_TIMEOUT',
};

const HANGUL_REGEX = /[ㄱ-힝]/;

/** i18n key 매핑 시도 — 미존재 시 null. */
function tryTranslate(t: TFn, key: string): string | null {
  const translated = t(key);
  return translated && translated !== key ? translated : null;
}

/**
 * 에러 → 사용자 친화 다국어 메시지 변환.
 *
 * @param err catch 블록의 unknown 에러
 * @param fallback 컨텍스트 안내 문구 (호출자가 t() 한 결과)
 * @param t i18n 함수 — useLocaleStore(s => s.t)
 */
export function toUserMessage(err: unknown, fallback: string, t: TFn): string {
  if (err instanceof ApiError) {
    // 1. ERR_* code 우선 매핑 (BE PR #53/#54 stable code)
    if (err.code?.startsWith('ERR_')) {
      const translated = tryTranslate(t, `error.${err.code}`);
      if (translated) return translated;
    }

    // 2. 영문 메시지 매핑 (legacy BE)
    const msgKey = ENGLISH_MSG_TO_I18N[err.message];
    if (msgKey) {
      const translated = tryTranslate(t, msgKey);
      if (translated) return translated;
    }

    // 3. status 별 fallback
    const statusKey = STATUS_TO_I18N[err.status];
    if (statusKey) {
      const translated = tryTranslate(t, statusKey);
      if (translated) return translated;
    }

    // 4. 한글 메시지면 그대로 (BE 가 legacy 한국어 직접 노출)
    if (HANGUL_REGEX.test(err.message)) return err.message;

    return err.message || fallback;
  }

  if (err instanceof Error) {
    const msgKey = ENGLISH_MSG_TO_I18N[err.message];
    if (msgKey) {
      const translated = tryTranslate(t, msgKey);
      if (translated) return translated;
    }
    if (HANGUL_REGEX.test(err.message)) return err.message;
    return fallback;
  }

  return fallback;
}

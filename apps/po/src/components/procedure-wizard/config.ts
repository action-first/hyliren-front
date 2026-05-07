import { LOCALES, type Locale } from '@hyliren/shared';

/**
 * PO wizard 에서 편집 가능한 locale 목록 = LOCALES 정본.
 *
 * 별도 정의를 두면 LOCALES drift 위험이 있어 정본을 그대로 alias.
 * 새 locale (zh-TW, vi 등) 추가 시 LOCALES 한 곳만 수정하면 wizard 에 자동 노출.
 *
 * 주의: sourceLocale 은 반드시 LOCALES 에 포함되어 있어야 함.
 */
export const PO_WIZARD_LOCALES: readonly Locale[] = LOCALES;

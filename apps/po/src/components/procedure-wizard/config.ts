import type { Locale } from '@hyliren/shared';

/**
 * PO wizard 에서 편집 가능한 locale 목록.
 *
 * 데이터 모델·API·LOCALES enum 은 ['ko', 'zh-CN', 'ja', 'en'] 전체를 계속 지원.
 * 이 상수만 UI 표시 여부를 제어 — ja/en 확장 시점에 배열에 추가하면 자동 노출.
 *
 * 주의: sourceLocale 은 반드시 이 배열에 포함되어 있어야 함 (현재 'ko' 기본).
 */
export const PO_WIZARD_LOCALES: Locale[] = ['ko', 'zh-CN'];

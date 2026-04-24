/**
 * Wizard 폼 상태 타입 — 4-step 간 공유되는 단일 객체.
 * API 의 CreateProcedureInput 에 가깝게 구성하되, UI 편의상 몇 가지 차이:
 * - sourceLocale 별도 관리
 * - variants 는 local id (아직 DB 미저장) 를 포함, 편집 편의성 목적
 */
import type {
  BodyArea, AnesthesiaType,
  ProcedureType, ProcedureStatus, Locale,
} from '@hyliren/shared';
import type { ProcedureI18n, ProcedureVariantI18n } from '@hyliren/shared';

export interface WizardForm {
  /* Step 1 */
  primaryArea: BodyArea | '';
  procedureType: ProcedureType | '';
  heroImageUrl: string;
  slug: string;             // 빈 문자열이면 서버에서 자동 생성
  sourceLocale: Locale;
  i18n: Partial<Record<Locale, ProcedureI18n>>;

  /* Step 2 (base values + variants) */
  basePrice: number;
  baseAnesthesia: AnesthesiaType;
  baseDurationMinutes: number;
  baseRecoveryDays: number;
  baseHospitalStayDays: number;
  variants: WizardVariant[];

  /* Step 3 */
  galleryImageUrls: string[];

  /* Step 4 */
  status: ProcedureStatus;
}

/**
 * Wizard 에서 편집 중인 variant — local id 가 달림.
 * create mode 는 저장 전엔 DB 에 없고, edit mode 는 기존 id (pv-xxx) 를 그대로 사용.
 */
export interface WizardVariant {
  id: string;                              // local uid 또는 DB id
  isNew: boolean;                          // edit mode 에서 아직 DB 에 저장 안 된 variant
  price: number | null;
  anesthesia: AnesthesiaType | null;
  durationMinutes: number | null;
  recoveryDays: number | null;
  hospitalStayDays: number | null;
  sortOrder: number;
  isDefault: boolean;
  i18n: Partial<Record<Locale, ProcedureVariantI18n>>;
}

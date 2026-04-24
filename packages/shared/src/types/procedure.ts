import type {
  BodyArea, AnesthesiaType,
  ProcedureType, ProcedureStatus, Locale,
} from '../constants';

/* ══════════════════════════════════════════════════════════════
   Procedure 도메인 타입 — 3 entities, JSON i18n 컬럼
   핵심 i18n 필드: 6개 (title/description/precautions/indications + variant.name/description)
   enum 라벨 (BodyArea 등) 은 per-record i18n 아님 — 상수 레벨 매핑
   ══════════════════════════════════════════════════════════════ */

/** Procedure 의 locale 별 번역 블럭. */
export interface ProcedureI18n {
  title: string;
  description: string;
  precautions: string;
  indications: string[];
}

/** Variant 의 locale 별 번역 블럭. */
export interface ProcedureVariantI18n {
  name: string;
  description: string | null;
}

/**
 * 시술 상품 메인 엔티티 — 카드·리스트·상세 모두 이 한 엔티티가 커버.
 *
 * priceMin/priceMax 는 variants 의 effective price 집계값 (denormalized).
 * variant CRUD 발생 시 애플리케이션 레이어에서 재계산.
 *
 * base* 값은 variant 의 숫자 override 가 null 일 때 승계되는 기본값.
 *
 * i18n 은 JSON 컬럼. 키는 Locale, 값은 ProcedureI18n. 누락된 locale 은
 * domain/procedure.ts 의 pickI18n() 가 sourceLocale 로 fallback.
 */
export interface Procedure {
  id: string;
  memberId: string;
  slug: string;                    // SEO URL, unique

  /* 분류 */
  primaryArea: BodyArea;
  procedureType: ProcedureType;

  /* 미디어 */
  heroImageUrl: string;
  galleryImageUrls: string[];      // ≤8

  /* 가격 · 기본값 */
  priceMin: number;                // variants 집계
  priceMax: number;                // variants 집계
  currency: 'KRW';
  basePrice: number;
  baseAnesthesia: AnesthesiaType;
  baseDurationMinutes: number;
  baseRecoveryDays: number;
  baseHospitalStayDays: number;

  /* 수명주기 · 원본 언어 */
  status: ProcedureStatus;
  sourceLocale: Locale;            // 기본 'ko'

  /* 메트릭 */
  viewCount: number;
  bookmarkCount: number;
  consultClickCount: number;

  /* 번역 콘텐츠 */
  i18n: Partial<Record<Locale, ProcedureI18n>>;

  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

/**
 * 시술 옵션 (variant). 예: 쌍꺼풀 상품의 매몰/부분절개/절개.
 * 숫자 override 필드가 null 이면 Procedure.base* 승계.
 * name·description 은 locale 별로 i18n 에 저장.
 */
export interface ProcedureVariant {
  id: string;
  procedureId: string;

  /* Override — null 이면 Procedure.base* 승계 */
  price: number | null;
  anesthesia: AnesthesiaType | null;
  durationMinutes: number | null;
  recoveryDays: number | null;
  hospitalStayDays: number | null;

  sortOrder: number;
  isDefault: boolean;

  /* 번역 콘텐츠 */
  i18n: Partial<Record<Locale, ProcedureVariantI18n>>;

  createdAt: string;
  updatedAt: string;
}

/**
 * 사용자 북마크 (N:M). 추가·삭제 시 procedure.bookmarkCount 증감.
 * Unique (userId, procedureId).
 */
export interface ProcedureBookmark {
  id: string;
  userId: string;
  procedureId: string;
  createdAt: string;
}

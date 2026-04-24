import type {
  BodyArea,
  AnesthesiaType,
  ProcedureType,
  ProcedureStatus,
} from '../constants';

/**
 * 시술 상품 — 카드 · 리스트 · 검색에 노출되는 경량 엔티티.
 *
 * 무거운 상세 본문 (description, precautions 등) 은 procedure_details 로 분리.
 * 가격 (priceMin/priceMax) 은 variants 의 effective price 집계값 — 애플리케이션
 * 레이어에서 variant CRUD 발생 시 재계산해 저장 (denormalized).
 */
export interface Procedure {
  id: string;
  memberId: string;                // 등록 주체 = 병원 (광고 주체)
  slug: string;                    // SEO URL: /procedures/[slug]. unique

  /* 카드 노출 필드 */
  title: string;                   // ≤80
  titleZh: string;
  primaryArea: BodyArea;
  procedureType: ProcedureType;
  heroImageUrl: string;            // 카드 썸네일 + 상세 Hero 공용

  /* 가격 — variants 집계 (effective = variant.price ?? detail.basePrice) */
  priceMin: number;
  priceMax: number;
  currency: 'KRW';

  /* 상태·수명주기 */
  status: ProcedureStatus;
  publishedAt: string | null;

  /* 메트릭 — 카드·분석에 노출 가능 */
  viewCount: number;
  bookmarkCount: number;
  consultClickCount: number;

  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

/**
 * 시술 상세 — 상세페이지 본문 + variant 기본값 (base*).
 * Procedure 와 1:1. draft 단계부터 동반 생성됨.
 */
export interface ProcedureDetail {
  procedureId: string;             // PK = FK

  /* 공통 본문 */
  description: string;             // ≤2000
  descriptionZh: string;
  indications: string[];           // 최대 5
  precautions: string;             // ≤500, 의료법 필수 고지
  precautionsZh: string;
  galleryImageUrls: string[];      // 최대 8

  /* 기본값 — variant 의 동일 필드가 null 일 때 승계 */
  basePrice: number;               // 기본 가격 (variant 1개만 있을 때의 노출가)
  baseAnesthesia: AnesthesiaType;
  baseDurationMinutes: number;     // 시술 소요 시간
  baseRecoveryDays: number;
  baseHospitalStayDays: number;

  updatedAt: string;
}

/**
 * 시술 옵션 — 한 상품에 N개. 예: 쌍꺼풀 상품의 매몰법 / 부분절개 / 절개법.
 * 각 필드가 null 이면 ProcedureDetail.base* 를 승계.
 * PO wizard 는 base 값으로 폼을 prefill 하고, 사용자가 편집하면 override 가 저장된다.
 */
export interface ProcedureVariant {
  id: string;
  procedureId: string;

  /* 옵션 식별 */
  name: string;                    // 예: "매몰법"
  nameZh: string;
  description: string | null;      // 옵션별 부가 설명
  descriptionZh: string | null;

  /* Override 필드 — null 이면 base 승계 */
  price: number | null;
  anesthesia: AnesthesiaType | null;
  durationMinutes: number | null;
  recoveryDays: number | null;
  hospitalStayDays: number | null;

  sortOrder: number;               // 옵션 정렬 (0, 10, 20, ...)
  isDefault: boolean;              // 대표 옵션 (최소 1개)

  createdAt: string;
  updatedAt: string;
}

/**
 * 사용자의 시술 북마크 (N:M).
 * 저장/삭제 시 procedure.bookmarkCount 애플리케이션 레이어 증감.
 * Unique (userId, procedureId) 제약.
 */
export interface ProcedureBookmark {
  id: string;
  userId: string;
  procedureId: string;
  createdAt: string;
}

/* ── Effective 계산 헬퍼 ── */
/**
 * variant 와 detail 을 받아 effective 값 계산. null override 는 base 승계.
 */
export function getEffectiveVariant(
  variant: ProcedureVariant,
  detail: ProcedureDetail,
): {
  price: number;
  anesthesia: AnesthesiaType;
  durationMinutes: number;
  recoveryDays: number;
  hospitalStayDays: number;
} {
  return {
    price: variant.price ?? detail.basePrice,
    anesthesia: variant.anesthesia ?? detail.baseAnesthesia,
    durationMinutes: variant.durationMinutes ?? detail.baseDurationMinutes,
    recoveryDays: variant.recoveryDays ?? detail.baseRecoveryDays,
    hospitalStayDays: variant.hospitalStayDays ?? detail.baseHospitalStayDays,
  };
}

/**
 * variants 의 effective price 로 procedure.priceMin/priceMax 재계산.
 * variants 가 비어 있으면 basePrice 단일값.
 */
export function computePriceRange(
  variants: ProcedureVariant[],
  detail: ProcedureDetail,
): { priceMin: number; priceMax: number } {
  if (variants.length === 0) {
    return { priceMin: detail.basePrice, priceMax: detail.basePrice };
  }
  const prices = variants.map(v => v.price ?? detail.basePrice);
  return { priceMin: Math.min(...prices), priceMax: Math.max(...prices) };
}

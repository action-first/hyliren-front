/** 백엔드 wire shape — 필드명은 customer API 응답 그대로 */

export interface ProcedureListItemWire {
  id: string;
  memberId: string;
  slug: string;
  primaryArea: string;
  procedureType: string;
  heroImageUrl: string;
  priceMin: number;
  priceMax: number;
  currency: 'KRW';
  title: string;
}

export interface ProcedureListWire {
  locale: string;
  procedures: ProcedureListItemWire[];
  total: number;
}

export interface ProcedureDetailWire {
  id: string;
  memberId: string;
  slug: string;
  primaryArea: string;
  procedureType: string;
  heroImageUrl: string;
  galleryImageUrls: string[];
  priceMin: number;
  priceMax: number;
  currency: 'KRW';
  viewCount: number;
  bookmarkCount: number;
  title: string;
  description: string;
  precautions: string;
  indications: string[];
}

export interface ProcedureVariantWire {
  id: string;
  sortOrder: number;
  isDefault: boolean;
  price: number;
  anesthesia: string;
  durationMinutes: number;
  recoveryDays: number;
  hospitalStayDays: number;
  name: string;
  description: string | null;
}

export interface ProcedureDetailResponseWire {
  locale: string;
  fallback: boolean;
  isBookmarked: boolean;
  procedure: ProcedureDetailWire;
  variants: ProcedureVariantWire[];
}

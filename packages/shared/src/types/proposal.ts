import type { ProposalStatus, AnesthesiaType } from '../constants';

export interface Proposal {
  id: string;
  concernId: string;
  memberId: string;
  version: number;
  isActive: boolean;
  status: ProposalStatus;

  // 비교 핵심 필드 (정규화 값)
  totalPrice: number;        // KRW 만원, 최종 권위 값
  recoveryDays: number;
  anesthesiaType: AnesthesiaType;
  hospitalStayDays: number;
  availableDateFrom: string | null;
  availableDateTo: string | null;

  // 보조 (유일한 free text)
  consultationNote: string | null;

  // 품질
  qualityScore: number | null;
  isFlagged: boolean;

  // 과금
  creditsCharged: number;

  sentAt: string | null;
  viewedAt: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface ProposalItem {
  id: string;
  proposalId: string;
  treatmentName: string;
  treatmentNameZh: string | null;
  price: number;              // KRW 만원, 설명용 (합계 ≠ totalPrice 허용)
  description: string | null; // 보조 전용
  sortOrder: number;
  createdAt: string;
}

export interface ProposalImage {
  id: string;
  proposalId: string;
  url: string;
  caption: string | null;
  sortOrder: number;
  createdAt: string;
}

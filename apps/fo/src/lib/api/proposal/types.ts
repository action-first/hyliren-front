/** 백엔드 wire shape — 필드명은 API 응답 그대로 */

export interface ProposalItemWire {
  id: string;
  proposalId: string;
  treatmentName: string;
  treatmentNameZh: string | null;
  price: number;
  description: string | null;
  sortOrder: number;
  createdAt: string;
}

export interface ProposalListItemWire {
  id: string;
  concernId: string;
  memberId: string;
  version: number;
  isActive: boolean;
  status: string;
  hospitalName: string;
  hospitalLogo: string | null;
  totalPrice: number;
  recoveryDays: number;
  anesthesiaType: string;
  hospitalStayDays: number;
  availableDateFrom: string | null;
  availableDateTo: string | null;
  consultationNote: string | null;
  qualityScore: number | null;
  isFavorite: boolean;
  isFlagged: boolean;
  creditsCharged: number;
  sentAt: string | null;
  viewedAt: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  items: ProposalItemWire[];
}

export interface ProposalListWire {
  proposals: ProposalListItemWire[];
  total: number;
}

/** GET /api/v1/proposals/:proposalId — backend ProposalDetailResponseDto 와 매칭. */
export interface ProposalDetailItemWire {
  id: string;
  procedureName: string;
  procedureNameZh?: string | null;
  price: number;
  description?: string | null;
  sortOrder?: number;
}

export interface ProposalDetailWire {
  id: string;
  concernId: string;
  hospitalId: string;
  hospitalName: string;
  hospitalDescription: string | null;
  hospitalLogo: string | null;
  hospitalIsCertified: boolean;
  hospitalRating: number | null;
  hospitalSpecialties: string[];
  hospitalAddress: string | null;
  totalPrice: number;
  recoveryDays: number;
  anesthesiaType: string;
  hospitalStayDays: number;
  consultationNote: string | null;
  qualityScore: number | null;
  isFavorite: boolean;
  isFlagged: boolean;
  items: ProposalDetailItemWire[];
  sentAt?: string | null;
  viewedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface SelectHospitalBody {
  proposalId: string;
}

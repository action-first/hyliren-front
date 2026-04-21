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

export interface SelectHospitalBody {
  proposalId: string;
}

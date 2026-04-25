/**
 * 백엔드 wire shape — `apps/partner/src/proposal/dtos/response/` 와 1:1 매칭.
 * 금액 wire 값은 DB 계약에 맞춘 KRW 원 단위다.
 * PO 입력 폼은 UX 상 만원 단위를 쓰므로 requests.ts 에서 outbound 변환한다.
 */

export interface ProposalItemWire {
  id: string;
  treatmentName: string;
  treatmentNameZh: string | null;
  price: number;
  description: string | null;
  sortOrder: number;
}

export interface ProposalSummaryWire {
  id: string;
  concernId: string;
  status: string;
  totalPrice: number;
  recoveryDays: number;
  anesthesiaType: string;
  hospitalStayDays: number;
  consultationNote: string | null;
  availableDateFrom: string | null;
  availableDateTo: string | null;
  sentAt: string | null;
  viewedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProposalDetailWire extends ProposalSummaryWire {
  items: ProposalItemWire[];
}

export interface ProposalListWire {
  proposals: ProposalDetailWire[];
  total: number;
}

export interface ProposalItemInput {
  treatmentName: string;
  treatmentNameZh?: string | null;
  /** PO form input unit: 만원 */
  price: number;
  description?: string | null;
  sortOrder?: number;
}

export interface CreateProposalBody {
  /** PO form input unit: 만원 */
  totalPrice: number;
  recoveryDays: number;
  anesthesiaType: 'local' | 'sedation' | 'general';
  hospitalStayDays?: number;
  consultationNote?: string;
  availableDateFrom?: string;
  availableDateTo?: string;
  items: ProposalItemInput[];
}

export type UpdateProposalBody = Partial<CreateProposalBody>;

/**
 * 백엔드 wire shape — `apps/partner/src/concern/dtos/response/` 와 1:1 매칭.
 * Customer 측 wire shape 와 다름:
 *   - userId / rawNarrative / aiSummary / feedbackTurns 미포함 (정책상 partner 미노출)
 */

export interface ConcernSummaryWire {
  id: string;
  status: string;
  source: string;
  description: string;
  primaryArea: string;
  bodyAreas: string[];
  bodyAreaDetail: string | null;
  budgetMin: number | null;
  budgetMax: number | null;
  visitDateFrom: string | null;
  visitDateTo: string | null;
  proposalCount: number;
  /** 본인(요청 partner) 활성 제안서 발송일. 미발송이면 null. */
  mySentAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ConcernPhotoWire {
  id: string;
  url: string;
  sortOrder: number;
}

export interface ConcernDetailWire extends ConcernSummaryWire {
  photos: ConcernPhotoWire[];
}

export interface ConcernListWire {
  concerns: ConcernSummaryWire[];
  total: number;
}

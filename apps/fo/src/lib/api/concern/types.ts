/** 백엔드 wire shape — 필드명은 API 응답 그대로 */

export interface ConcernWire {
  id: string;
  userId: string;
  status: string;
  source: string;
  description: string;
  primaryArea: string;
  bodyAreas: string[];
  bodyAreaDetail: string | null;
  hasPassport: boolean;
  aiSummary: Record<string, unknown> | null;
  budgetMin: number | null;
  budgetMax: number | null;
  visitDateFrom: string | null;
  visitDateTo: string | null;
  proposalCount: number;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  photos: ConcernPhotoWire[];
  selectedHospital: {
    id: string;
    proposalId: string;
    selectedAt: string;
  } | null;
}

export interface ConcernListItemWire {
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
  createdAt: string;
  updatedAt: string;
}

export interface ConcernListWire {
  concerns: ConcernListItemWire[];
  total: number;
  page: number;
  limit: number;
}

export interface ConcernPhotoWire {
  id: string;
  url: string;
  sortOrder: number;
}

export interface CreateConcernBody {
  description: string;
  areas?: string[];
  detail?: string;
  budgetMin?: number;
  budgetMax?: number;
  visitDateFrom?: string;
  visitDateTo?: string;
  photos?: string[];
  source?: string;
}

export interface UpdateConcernBody {
  description?: string;
  budgetMin?: number;
  budgetMax?: number;
  visitDateFrom?: string;
  visitDateTo?: string;
}

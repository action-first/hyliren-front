import type { ConcernStatus, ConcernSource, BodyArea } from '../constants';

export interface Concern {
  id: string;
  userId: string;
  status: ConcernStatus;
  source: ConcernSource;
  bodyArea: BodyArea;
  bodyAreaDetail: string | null;
  description: string;
  budgetMin: number | null;
  budgetMax: number | null;
  visitDateFrom: string | null;
  visitDateTo: string | null;
  hasPassport: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface ConcernPhoto {
  id: string;
  concernId: string;
  url: string;
  sortOrder: number;
  createdAt: string;
}

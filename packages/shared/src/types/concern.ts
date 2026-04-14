import type { ConcernStatus, ConcernSource, BodyArea } from '../constants';

export interface Concern {
  id: string;
  userId: string;
  status: ConcernStatus;
  source: ConcernSource;
  /** 복수 부위 지원 — 최소 1개 */
  bodyAreas: BodyArea[];
  /** 대표 부위 (UI 표시용) */
  primaryArea: BodyArea;
  /** @deprecated bodyAreas[0]으로 대체 — 하위 호환용 getter */
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

import type { Concern, ConcernPhoto, ConcernStatus, BodyArea } from '@hyliren/shared';
import { BODY_AREAS } from '@hyliren/shared';

import type { ConcernWire, ConcernListItemWire, ConcernPhotoWire } from './types';

const VALID_BODY_AREAS = new Set<string>(BODY_AREAS);

function toBodyArea(raw: string): BodyArea {
  return VALID_BODY_AREAS.has(raw) ? (raw as BodyArea) : '기타';
}

/**
 * API DB status(draft/submitted/closed) → FO ConcernStatus
 *
 * DB는 3단계만 저장. FO의 세분화된 상태는 proposalCount + selectedHospital로 파생.
 * - submitted + proposalCount=0  → 'submitted'
 * - submitted + proposalCount=1  → 'proposal_received'
 * - submitted + proposalCount>=2 → 'comparing'
 * - closed + selectedHospital    → 'hospital_selected'
 * - closed + no selectedHospital → 'completed'
 */
export function mapStatus(
  raw: string,
  proposalCount: number,
  hasSelectedHospital = false,
): ConcernStatus {
  switch (raw) {
    case 'draft':
      return 'draft';
    case 'submitted':
      if (proposalCount >= 2) { return 'comparing'; }
      if (proposalCount === 1) { return 'proposal_received'; }
      return 'submitted';
    case 'closed':
      return hasSelectedHospital ? 'hospital_selected' : 'completed';
    default:
      console.warn(`[concern mapper] unknown status: ${raw}, falling back to draft`);
      return 'draft';
  }
}

function toIso(value: string | null | undefined): string | null {
  if (!value) return null;
  // Already ISO string or date-only string — return as-is
  return value;
}

export function mapConcernListItem(wire: ConcernListItemWire): Concern {
  const bodyAreas = (wire.bodyAreas ?? []).map(toBodyArea);
  const primaryArea = toBodyArea(wire.primaryArea);

  return {
    id: wire.id,
    userId: '',
    status: mapStatus(wire.status, wire.proposalCount, false),
    source: (wire.source ?? 'organic') as Concern['source'],
    bodyAreas,
    primaryArea,
    bodyArea: primaryArea,
    bodyAreaDetail: wire.bodyAreaDetail,
    description: wire.description,
    // list wire 는 상세 필드 미포함 — 상세 조회 (mapConcernDetail) 에서 채워짐
    rawNarrative: null,
    aiSummary: null,
    feedbackTurns: [],
    budgetMin: wire.budgetMin,
    budgetMax: wire.budgetMax,
    visitDateFrom: toIso(wire.visitDateFrom),
    visitDateTo: toIso(wire.visitDateTo),
    hasPassport: false,
    createdAt: wire.createdAt,
    updatedAt: wire.updatedAt,
    deletedAt: null,
  };
}

export function mapConcernDetail(wire: ConcernWire): Concern {
  const bodyAreas = (wire.bodyAreas ?? []).map(toBodyArea);
  const primaryArea = toBodyArea(wire.primaryArea);

  return {
    id: wire.id,
    userId: wire.userId,
    status: mapStatus(wire.status, wire.proposalCount, wire.selectedHospital != null),
    source: (wire.source ?? 'organic') as Concern['source'],
    bodyAreas,
    primaryArea,
    bodyArea: primaryArea,
    bodyAreaDetail: wire.bodyAreaDetail,
    description: wire.description,
    rawNarrative: wire.rawNarrative,
    aiSummary: wire.aiSummary,
    feedbackTurns: wire.feedbackTurns ?? [],
    budgetMin: wire.budgetMin,
    budgetMax: wire.budgetMax,
    visitDateFrom: toIso(wire.visitDateFrom),
    visitDateTo: toIso(wire.visitDateTo),
    hasPassport: wire.hasPassport,
    createdAt: wire.createdAt,
    updatedAt: wire.updatedAt,
    deletedAt: wire.deletedAt,
  };
}

export function mapConcernPhoto(wire: ConcernPhotoWire, concernId: string, createdAt: string): ConcernPhoto {
  return {
    id: wire.id,
    concernId,
    url: wire.url,
    sortOrder: wire.sortOrder,
    createdAt,
  };
}

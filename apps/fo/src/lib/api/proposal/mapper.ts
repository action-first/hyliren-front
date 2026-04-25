import type { Proposal, ProposalItem, AnesthesiaType, ProposalStatus } from '@hyliren/shared';
import { krwToMan } from '@hyliren/shared';

import type { ProposalListItemWire, ProposalItemWire } from './types';

const VALID_ANESTHESIA = new Set(['local', 'sedation', 'general']);
const VALID_STATUS = new Set(['draft', 'sent', 'accepted', 'rejected', 'expired']);

function toAnesthesia(raw: string): AnesthesiaType {
  return VALID_ANESTHESIA.has(raw) ? (raw as AnesthesiaType) : 'local';
}

function toProposalStatus(raw: string): ProposalStatus {
  return VALID_STATUS.has(raw) ? (raw as ProposalStatus) : 'sent';
}

export function mapProposalItem(wire: ProposalItemWire): ProposalItem {
  return {
    id: wire.id,
    proposalId: wire.proposalId,
    treatmentName: wire.treatmentName,
    treatmentNameZh: wire.treatmentNameZh,
    price: krwToMan(wire.price),
    description: wire.description,
    sortOrder: wire.sortOrder,
    createdAt: wire.createdAt,
  };
}

export function mapProposal(wire: ProposalListItemWire): Proposal {
  return {
    id: wire.id,
    concernId: wire.concernId,
    memberId: wire.memberId,
    version: wire.version,
    isActive: wire.isActive,
    status: toProposalStatus(wire.status),
    totalPrice: krwToMan(wire.totalPrice),
    recoveryDays: wire.recoveryDays,
    anesthesiaType: toAnesthesia(wire.anesthesiaType),
    hospitalStayDays: wire.hospitalStayDays,
    availableDateFrom: wire.availableDateFrom,
    availableDateTo: wire.availableDateTo,
    consultationNote: wire.consultationNote,
    qualityScore: wire.qualityScore,
    isFlagged: wire.isFlagged,
    creditsCharged: wire.creditsCharged,
    sentAt: wire.sentAt,
    viewedAt: wire.viewedAt,
    createdAt: wire.createdAt,
    updatedAt: wire.updatedAt,
    deletedAt: wire.deletedAt,
  };
}

/** wire 응답에서 hospitalName을 별도로 추출 (FO 페이지 표시용) */
export function extractHospitalInfo(wire: ProposalListItemWire): { hospitalName: string; hospitalLogo: string | null } {
  return { hospitalName: wire.hospitalName, hospitalLogo: wire.hospitalLogo };
}

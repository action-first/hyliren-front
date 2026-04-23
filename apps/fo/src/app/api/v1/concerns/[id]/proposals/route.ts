import { NextRequest, NextResponse } from 'next/server';
import { getProposals, getProposalItems } from '@hyliren/shared/src/server/data-store';
import { MOCK_PARTNER_PROFILES } from '@hyliren/shared';

/**
 * 내부 proposal status → wire status 변환.
 * DB proposal_status ENUM ('draft','sent','accepted','rejected','expired') 기준으로 매핑.
 * FO mock 에서 사용하던 'selected' 는 'accepted' 로, 'viewed'/'shortlisted' 는 'sent' 로 요약.
 */
function toWireStatus(s: string): string {
  if (s === 'accepted' || s === 'selected') return 'accepted';
  if (s === 'rejected') return 'rejected';
  if (s === 'expired') return 'expired';
  if (s === 'draft') return 'draft';
  return 'sent';
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: concernId } = await params;
  const proposals = getProposals().filter(p => p.concernId === concernId && p.isActive);
  const allItems = getProposalItems();

  const items = proposals.map(p => {
    const profile = MOCK_PARTNER_PROFILES.find(pp => pp.memberId === p.memberId);
    const proposalItems = allItems
      .filter(i => i.proposalId === p.id)
      .map(i => ({
        id: i.id,
        proposalId: i.proposalId,
        treatmentName: i.treatmentName,
        treatmentNameZh: i.treatmentNameZh,
        price: i.price,
        description: i.description,
        sortOrder: i.sortOrder,
        createdAt: i.createdAt,
      }));

    return {
      id: p.id,
      concernId: p.concernId,
      memberId: p.memberId,
      version: p.version,
      isActive: p.isActive,
      status: toWireStatus(p.status),
      hospitalName: profile?.hospitalName ?? '병원명 미확인',
      hospitalLogo: profile?.logoUrl ?? null,
      totalPrice: p.totalPrice,
      recoveryDays: p.recoveryDays,
      anesthesiaType: p.anesthesiaType,
      hospitalStayDays: p.hospitalStayDays,
      availableDateFrom: p.availableDateFrom,
      availableDateTo: p.availableDateTo,
      consultationNote: p.consultationNote,
      qualityScore: p.qualityScore,
      isFavorite: false,
      isFlagged: p.isFlagged,
      creditsCharged: p.creditsCharged,
      sentAt: p.sentAt,
      viewedAt: p.viewedAt,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
      deletedAt: p.deletedAt,
      items: proposalItems,
    };
  });

  return NextResponse.json({
    success: true,
    data: { proposals: items, total: items.length },
  });
}

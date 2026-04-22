import { NextRequest, NextResponse } from 'next/server';
import { getConcernById, getConcernPhotos, getProposals, updateConcern } from '@hyliren/shared/src/server/data-store';

function toWireStatus(s: string): string {
  if (s === 'draft') return 'draft';
  if (s === 'hospital_selected' || s === 'completed') return 'closed';
  return 'submitted';
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const concern = getConcernById(id);
  if (!concern) {
    return NextResponse.json({ success: false, statusCode: 404, message: 'Not found' }, { status: 404 });
  }

  const photos = getConcernPhotos()
    .filter(p => p.concernId === id)
    .map(p => ({ id: p.id, url: p.url, sortOrder: p.sortOrder }));

  const proposals = getProposals().filter(p => p.concernId === id);
  const proposalCount = proposals.length;

  const selectedProposal = concern.status === 'hospital_selected'
    ? proposals.find(p => p.status === 'selected')
    : null;

  return NextResponse.json({
    success: true,
    data: {
      id: concern.id,
      userId: concern.userId,
      status: toWireStatus(concern.status),
      source: concern.source,
      description: concern.description,
      primaryArea: concern.primaryArea,
      bodyAreas: concern.bodyAreas,
      bodyAreaDetail: concern.bodyAreaDetail,
      hasPassport: concern.hasPassport,
      aiSummary: null,
      budgetMin: concern.budgetMin,
      budgetMax: concern.budgetMax,
      visitDateFrom: concern.visitDateFrom,
      visitDateTo: concern.visitDateTo,
      proposalCount,
      createdAt: concern.createdAt,
      updatedAt: concern.updatedAt,
      deletedAt: concern.deletedAt,
      photos,
      selectedHospital: selectedProposal
        ? { id: selectedProposal.memberId, proposalId: selectedProposal.id, selectedAt: concern.updatedAt }
        : null,
    },
  });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await req.json();
  const now = new Date().toISOString();
  updateConcern(id, { ...body, updatedAt: now });
  return NextResponse.json({ success: true });
}

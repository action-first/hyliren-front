import { getProposals, addProposal, getProposalItems, addProposalItems } from '@hyliren/shared/src/server/data-store';
import { NextRequest, NextResponse } from 'next/server';
import type { Proposal, ProposalItem } from '@hyliren/shared';
import { createProposalSchema } from './schema';

export async function GET(req: NextRequest) {
  try {
    const memberId = req.nextUrl.searchParams.get('memberId');
    let proposals = getProposals().filter(p => p.isActive);
    if (memberId) proposals = proposals.filter(p => p.memberId === memberId);
    proposals.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    const items = getProposalItems();
    return NextResponse.json({ proposals, items });
  } catch {
    return NextResponse.json({ error: 'Failed to load proposals' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: '유효한 JSON 요청이 필요합니다.' }, { status: 400 });
  }

  const parsed = createProposalSchema.safeParse(body);
  if (!parsed.success) {
    const firstError = parsed.error.issues[0];
    return NextResponse.json(
      { error: firstError?.message || '입력값이 올바르지 않습니다.' },
      { status: 400 },
    );
  }

  try {
    const data = parsed.data;
    const now = new Date().toISOString();
    const id = `p-${Date.now()}`;

    const proposal: Proposal = {
      id,
      concernId: data.concernId,
      memberId: data.memberId,
      version: 1,
      isActive: true,
      status: 'sent',
      totalPrice: data.totalPrice,
      recoveryDays: data.recoveryDays,
      anesthesiaType: data.anesthesiaType,
      hospitalStayDays: data.hospitalStayDays,
      availableDateFrom: data.availableDateFrom,
      availableDateTo: data.availableDateTo,
      consultationNote: data.consultationNote,
      qualityScore: null,
      isFlagged: false,
      creditsCharged: data.creditsCharged,
      sentAt: now,
      viewedAt: null,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    };

    addProposal(proposal);

    const proposalItems: ProposalItem[] = data.items.map((item, i) => ({
      id: `pi-${Date.now()}-${i}`,
      proposalId: id,
      treatmentName: item.name,
      treatmentNameZh: item.nameZh ?? null,
      price: item.price,
      description: null,
      sortOrder: i,
      createdAt: now,
    }));
    addProposalItems(proposalItems);

    return NextResponse.json({ ok: true, proposal });
  } catch {
    return NextResponse.json({ error: 'Failed to create proposal' }, { status: 500 });
  }
}

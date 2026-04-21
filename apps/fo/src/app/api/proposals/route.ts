import { getProposals, getProposalItems, updateProposal, getConcerns } from '@hyliren/shared/src/server/data-store';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const concernId = req.nextUrl.searchParams.get('concernId');
  const userId = req.nextUrl.searchParams.get('userId');
  let proposals = getProposals().filter(p => p.isActive && p.status !== 'draft');

  if (concernId) {
    proposals = proposals.filter(p => p.concernId === concernId);
  } else if (userId) {
    const userConcernIds = new Set(
      getConcerns().filter(c => c.userId === userId && !c.deletedAt).map(c => c.id)
    );
    proposals = proposals.filter(p => userConcernIds.has(p.concernId));
  }

  proposals.sort((a, b) => a.totalPrice - b.totalPrice);
  const items = getProposalItems();
  return NextResponse.json({ proposals, items });
}

export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const { id, ...updates } = body;
  if (!id) return NextResponse.json({ error: 'id 필수' }, { status: 400 });
  const updated = updateProposal(id, updates);
  if (!updated) return NextResponse.json({ error: '제안을 찾을 수 없습니다' }, { status: 404 });
  return NextResponse.json({ ok: true, proposal: updated });
}

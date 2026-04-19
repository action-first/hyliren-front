import { getConcerns, getProposals, getProposalItems } from '@hyliren/shared/src/server/data-store';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const memberId = req.nextUrl.searchParams.get('memberId');
  const concerns = getConcerns().filter(c => !c.deletedAt && c.status !== 'draft' && c.status !== 'cancelled');
  let proposals = getProposals().filter(p => p.isActive && p.status !== 'draft');
  if (memberId) proposals = proposals.filter(p => p.memberId === memberId);
  return NextResponse.json({ concerns, proposals });
}

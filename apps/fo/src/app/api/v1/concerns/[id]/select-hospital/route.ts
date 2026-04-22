import { NextRequest, NextResponse } from 'next/server';
import { updateProposal, updateConcern } from '@hyliren/shared/src/server/data-store';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: concernId } = await params;
  const { proposalId } = await req.json();
  const now = new Date().toISOString();

  updateProposal(proposalId, { status: 'selected', updatedAt: now });
  updateConcern(concernId, { status: 'hospital_selected', updatedAt: now });

  return NextResponse.json({ success: true, data: { id: concernId, proposalId } });
}

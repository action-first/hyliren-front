import { NextRequest, NextResponse } from 'next/server';
import { updateConcern } from '@hyliren/shared/src/server/data-store';

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  updateConcern(id, { status: 'submitted', updatedAt: new Date().toISOString() });
  return NextResponse.json({ success: true });
}

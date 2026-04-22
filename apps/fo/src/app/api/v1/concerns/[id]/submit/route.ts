import { NextRequest, NextResponse } from 'next/server';
import { getConcernById, updateConcern } from '@hyliren/shared/src/server/data-store';
import { requireUserId } from '@/lib/server/auth';
import { isResponse } from '@/lib/server/http';

/**
 * Real backend 는 상태 기반 거부도 404 로 통일한다
 * (concern.service.ts — "Concern must be in draft status"). 동일 동작 유지.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = requireUserId(req);
  if (isResponse(auth)) return auth;

  const { id } = await params;
  const concern = getConcernById(id);
  if (!concern || concern.userId !== auth.userId) {
    return NextResponse.json(
      { success: false, statusCode: 404, message: 'Not found' },
      { status: 404 },
    );
  }

  if (concern.status !== 'draft') {
    return NextResponse.json(
      { success: false, statusCode: 404, message: 'Concern must be in draft status' },
      { status: 404 },
    );
  }

  updateConcern(id, { status: 'submitted', updatedAt: new Date().toISOString() });
  return NextResponse.json({ success: true });
}

import { NextRequest, NextResponse } from 'next/server';
import { callBackend, proxyErrorToResponse } from '@/lib/api/partner-proxy';

/**
 * POST /api/procedures/[id]/variants
 * Partner 백엔드는 { id } 만 반환. PO 클라이언트는 { ok, id } 로 받음
 * (edit 페이지는 어차피 refetch 로 동기화).
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  let body: unknown;
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: '유효한 JSON 요청이 필요합니다' }, { status: 400 }); }

  try {
    const data = await callBackend<{ id: string }>(req, {
      method: 'POST',
      path: `/procedures/${id}/variants`,
      body,
    });
    return NextResponse.json({ ok: true, ...data }, { status: 201 });
  } catch (e) {
    return proxyErrorToResponse(e);
  }
}

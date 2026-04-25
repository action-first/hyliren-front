import { NextRequest, NextResponse } from 'next/server';
import { callBackend, proxyErrorToResponse } from '@/lib/api/partner-proxy';

/**
 * PATCH /api/procedures/[id]/variants/[variantId]
 * variant 부분 수정. 백엔드는 204 반환 (callBackend 가 undefined 처리).
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; variantId: string }> },
) {
  const { id, variantId } = await params;
  let body: unknown;
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: '유효한 JSON 요청이 필요합니다' }, { status: 400 }); }

  try {
    await callBackend<void>(req, {
      method: 'PATCH',
      path: `/procedures/${id}/variants/${variantId}`,
      body,
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return proxyErrorToResponse(e);
  }
}

/**
 * DELETE /api/procedures/[id]/variants/[variantId]
 * 마지막 variant 가드 + default 자동 승격 모두 백엔드 책임.
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; variantId: string }> },
) {
  const { id, variantId } = await params;
  try {
    await callBackend<void>(req, {
      method: 'DELETE',
      path: `/procedures/${id}/variants/${variantId}`,
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return proxyErrorToResponse(e);
  }
}

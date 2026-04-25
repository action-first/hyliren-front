import { NextRequest, NextResponse } from 'next/server';
import type { Procedure, ProcedureVariant } from '@hyliren/shared';
import { callBackend, proxyErrorToResponse } from '@/lib/api/partner-proxy';

/**
 * GET /api/procedures/[id]
 * Partner 백엔드 프록시. 소유권/i18n 처리는 백엔드 책임.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    const data = await callBackend<{ procedure: Procedure; variants: ProcedureVariant[] }>(req, {
      method: 'GET',
      path: `/procedures/${id}`,
    });
    return NextResponse.json(data);
  } catch (e) {
    return proxyErrorToResponse(e);
  }
}

/**
 * PATCH /api/procedures/[id]
 * 본체 + i18n upsert + publish-strict 검증 모두 백엔드 책임.
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  let body: unknown;
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: '유효한 JSON 요청이 필요합니다' }, { status: 400 }); }

  try {
    const data = await callBackend<{ procedure: Procedure }>(req, {
      method: 'PATCH',
      path: `/procedures/${id}`,
      body,
    });
    return NextResponse.json({ ok: true, ...data });
  } catch (e) {
    return proxyErrorToResponse(e);
  }
}

/**
 * DELETE /api/procedures/[id]
 * status → 'archived' (백엔드 softDelete).
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    const data = await callBackend<{ procedure: Procedure }>(req, {
      method: 'DELETE',
      path: `/procedures/${id}`,
    });
    return NextResponse.json({ ok: true, ...data });
  } catch (e) {
    return proxyErrorToResponse(e);
  }
}

import { NextRequest, NextResponse } from 'next/server';
import type { Procedure, ProcedureVariant } from '@hyliren/shared';
import { callBackend, proxyErrorToResponse } from '@/lib/api/partner-proxy';

/**
 * GET /api/procedures
 * Partner 백엔드 (`/partner/api/v1/procedures`) 로 직접 프록시.
 * memberId 는 JWT 에서 추출되므로 query 무시.
 */
export async function GET(req: NextRequest) {
  try {
    const data = await callBackend<{ procedures: Procedure[]; total: number }>(req, {
      method: 'GET',
      path: '/procedures',
      searchParams: req.nextUrl.searchParams,
    });
    return NextResponse.json(data);
  } catch (e) {
    return proxyErrorToResponse(e);
  }
}

/**
 * POST /api/procedures
 * 4-step wizard 완료 시 Procedure + Variants 일괄 생성.
 * 클라이언트가 보낸 memberId 는 body 에서 제거 (백엔드는 JWT 로 식별).
 */
export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: '유효한 JSON 요청이 필요합니다' }, { status: 400 });
  }

  try {
    const { memberId: _m, ...cleaned } = (body as { memberId?: string });
    void _m;
    const data = await callBackend<{ procedure: Procedure; variants: ProcedureVariant[] }>(req, {
      method: 'POST',
      path: '/procedures',
      body: cleaned,
    });
    return NextResponse.json({ ok: true, ...data }, { status: 201 });
  } catch (e) {
    return proxyErrorToResponse(e);
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { callPartnerAuth, authProxyErrorToResponse } from '@/lib/api/partner-auth-proxy';

export async function GET(req: NextRequest) {
  try {
    const auth = req.headers.get('authorization') ?? '';
    const me = await callPartnerAuth('/auth/me', {
      method: 'GET',
      headers: { Accept: 'application/json', Authorization: auth },
    });
    return NextResponse.json(me);
  } catch (e) {
    return authProxyErrorToResponse(e);
  }
}

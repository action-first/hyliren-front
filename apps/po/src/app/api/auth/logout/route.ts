import { NextRequest, NextResponse } from 'next/server';
import { callPartnerAuth, authProxyErrorToResponse } from '@/lib/api/partner-auth-proxy';

export async function POST(req: NextRequest) {
  try {
    const auth = req.headers.get('authorization') ?? '';
    await callPartnerAuth('/auth/logout', {
      method: 'POST',
      headers: { Accept: 'application/json', Authorization: auth },
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return authProxyErrorToResponse(e);
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { callPartnerAuth, authProxyErrorToResponse } from '@/lib/api/partner-auth-proxy';

interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const tokens = await callPartnerAuth<TokenPair>('/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(body),
    });
    return NextResponse.json(tokens);
  } catch (e) {
    return authProxyErrorToResponse(e);
  }
}

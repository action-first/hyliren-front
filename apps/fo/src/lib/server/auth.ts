import { NextRequest, NextResponse } from 'next/server';

const TOKEN_PREFIX = 'mock-access-';

export type AuthOk = { userId: string; email: string };

export function requireUserId(req: NextRequest): AuthOk | NextResponse {
  const header = req.headers.get('authorization') ?? '';
  const token = header.startsWith('Bearer ') ? header.slice('Bearer '.length) : '';

  if (!token.startsWith(TOKEN_PREFIX)) {
    return NextResponse.json(
      { success: false, statusCode: 401, message: 'Unauthorized' },
      { status: 401 },
    );
  }

  const email = token.slice(TOKEN_PREFIX.length);
  if (!email) {
    return NextResponse.json(
      { success: false, statusCode: 401, message: 'Unauthorized' },
      { status: 401 },
    );
  }

  const userId = email === 'test@test.com' ? 'u-001' : `u-${email}`;
  return { userId, email };
}

export function isAuthResponse(value: AuthOk | NextResponse): value is NextResponse {
  return value instanceof NextResponse;
}

import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { refreshToken } = await req.json();
  if (!refreshToken?.startsWith('mock-refresh-')) {
    return NextResponse.json({ success: false, statusCode: 401, message: 'Invalid refresh token' }, { status: 401 });
  }
  const email = refreshToken.replace('mock-refresh-', '');
  return NextResponse.json({
    success: true,
    data: {
      accessToken: `mock-access-${email}`,
      refreshToken: `mock-refresh-${email}`,
    },
  });
}

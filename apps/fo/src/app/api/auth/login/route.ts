import { NextRequest, NextResponse } from 'next/server';

const MOCK_ACCOUNTS = [
  { email: 'test@test.com', password: '123123123' },
];

export async function POST(req: NextRequest) {
  const { email, password } = await req.json();
  const match = MOCK_ACCOUNTS.find(a => a.email === email && a.password === password);
  if (!match) {
    return NextResponse.json({ success: false, statusCode: 401, message: 'Invalid credentials' }, { status: 401 });
  }
  return NextResponse.json({
    success: true,
    data: {
      accessToken: `mock-access-${email}`,
      refreshToken: `mock-refresh-${email}`,
    },
  });
}

import { NextRequest, NextResponse } from 'next/server';

const MOCK_USERS: Record<string, object> = {
  'mock-access-test@test.com': {
    id: 'u-001',
    role: 'buyer',
    email: 'test@test.com',
    phone: null,
    name: '테스트 유저',
    locale: 'ko',
    avatarUrl: null,
    referralCode: null,
    referredBy: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
};

export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization') ?? '';
  const token = auth.replace('Bearer ', '');
  const user = MOCK_USERS[token];
  if (!user) {
    return NextResponse.json({ success: false, statusCode: 401, message: 'Unauthorized' }, { status: 401 });
  }
  return NextResponse.json({ success: true, data: user });
}

import { addPayment } from '@hyliren/shared/src/server/data-store';
import { NextRequest, NextResponse } from 'next/server';
import { requireUserId } from '@/lib/server/auth';
import { parseJson, validateBody, isResponse } from '@/lib/server/http';
import { paymentSchema } from '@/server/schemas/concern';

export async function POST(req: NextRequest) {
  const auth = requireUserId(req);
  if (isResponse(auth)) return auth;

  const raw = await parseJson(req);
  if (isResponse(raw)) return raw;

  const input = validateBody(paymentSchema, raw);
  if (isResponse(input)) return input;

  // buyer 결제는 자기 자신의 userId로만 가능 (IDOR 차단)
  if (input.actorType === 'buyer' && input.actorId !== auth.userId) {
    return NextResponse.json(
      { success: false, statusCode: 403, message: '본인 계정으로만 결제할 수 있습니다.' },
      { status: 403 },
    );
  }

  const payment = addPayment(input);
  return NextResponse.json({ success: true, data: { payment } }, { status: 201 });
}

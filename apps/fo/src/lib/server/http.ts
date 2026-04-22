import { NextRequest, NextResponse } from 'next/server';
import type { ZodTypeAny, z } from 'zod';

export async function parseJson<T = unknown>(req: NextRequest): Promise<T | NextResponse> {
  try {
    return (await req.json()) as T;
  } catch {
    return NextResponse.json(
      { success: false, statusCode: 400, message: '유효한 JSON 요청이 필요합니다.' },
      { status: 400 },
    );
  }
}

export function validateBody<S extends ZodTypeAny>(
  schema: S,
  body: unknown,
): z.infer<S> | NextResponse {
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return NextResponse.json(
      {
        success: false,
        statusCode: 400,
        message: first?.message ?? '입력값이 올바르지 않습니다.',
        path: first?.path,
      },
      { status: 400 },
    );
  }
  return parsed.data;
}

export function isResponse(value: unknown): value is NextResponse {
  return value instanceof NextResponse;
}

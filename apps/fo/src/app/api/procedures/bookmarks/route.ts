import { NextRequest, NextResponse } from 'next/server';
import {
  getProcedureBookmarks, getProcedureById,
} from '@hyliren/shared/src/server/data-store';

/**
 * GET /api/procedures/bookmarks?userId=...
 * 유저의 북마크한 시술 목록 (procedure 본체와 함께)
 */
export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get('userId');
  if (!userId) return NextResponse.json({ error: 'userId 필수' }, { status: 400 });

  const bookmarks = getProcedureBookmarks(userId);
  const procedures = bookmarks
    .map(b => getProcedureById(b.procedureId))
    .filter((p): p is NonNullable<typeof p> => p !== null && p.status === 'published');

  return NextResponse.json({ bookmarks, procedures });
}

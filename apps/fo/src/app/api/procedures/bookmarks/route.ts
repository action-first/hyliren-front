import { NextRequest, NextResponse } from 'next/server';
import {
  getProcedureBookmarks, getProcedureById,
} from '@hyliren/shared/src/server/data-store';
import { pickI18n, resolveRequestLocale } from '@hyliren/shared/src/domain/procedure';
import type { Procedure } from '@hyliren/shared';

/**
 * GET /api/procedures/bookmarks?userId=...&locale=ko
 * 유저의 북마크한 시술 목록 (카드용 flat merged).
 */
export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get('userId');
  if (!userId) return NextResponse.json({ error: 'userId 필수' }, { status: 400 });

  const locale = resolveRequestLocale(
    req.nextUrl.searchParams.get('locale'),
    req.headers.get('accept-language'),
  );

  const bookmarks = getProcedureBookmarks(userId);
  const procedures = bookmarks
    .map(b => getProcedureById(b.procedureId))
    .filter((p): p is Procedure => p !== null && p.status === 'published')
    .map(p => {
      const pick = pickI18n(p.i18n, locale, p.sourceLocale);
      return {
        ...p,
        locale,
        fallback: pick?.fallback ?? true,
        title: pick?.content.title ?? '',
        i18n: undefined,
      };
    });

  return NextResponse.json({ locale, bookmarks, procedures });
}

import { NextRequest, NextResponse } from 'next/server';
import { getProcedures } from '@hyliren/shared/src/server/data-store';
import type { BodyArea, ProcedureType } from '@hyliren/shared/src/constants';

/**
 * GET /api/procedures
 * FO 시술 카탈로그. published 만 노출.
 *
 * Query:
 *  - primaryArea: BodyArea (선택)
 *  - procedureType: ProcedureType (선택)
 *  - memberId: string (선택, 특정 병원 시술만)
 *  - sort: 'latest' | 'price_asc' | 'price_desc' | 'popular' (기본 'latest')
 *  - limit: number (기본 20, 최대 100)
 */
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const primaryArea = searchParams.get('primaryArea') as BodyArea | null;
  const procedureType = searchParams.get('procedureType') as ProcedureType | null;
  const memberId = searchParams.get('memberId');
  const sort = searchParams.get('sort') ?? 'latest';
  const limit = Math.min(100, Number(searchParams.get('limit')) || 20);

  let procedures = getProcedures().filter(
    p => p.status === 'published' && !p.deletedAt,
  );

  if (primaryArea) procedures = procedures.filter(p => p.primaryArea === primaryArea);
  if (procedureType) procedures = procedures.filter(p => p.procedureType === procedureType);
  if (memberId) procedures = procedures.filter(p => p.memberId === memberId);

  switch (sort) {
    case 'price_asc':
      procedures.sort((a, b) => a.priceMin - b.priceMin);
      break;
    case 'price_desc':
      procedures.sort((a, b) => b.priceMin - a.priceMin);
      break;
    case 'popular':
      procedures.sort((a, b) => b.viewCount + b.bookmarkCount - (a.viewCount + a.bookmarkCount));
      break;
    case 'latest':
    default:
      procedures.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  const total = procedures.length;
  return NextResponse.json({ procedures: procedures.slice(0, limit), total });
}

import { NextRequest, NextResponse } from 'next/server';
import { getConcerns, addConcern, getProposals } from '@hyliren/shared/src/server/data-store';
import type { Concern } from '@hyliren/shared';

function toWireStatus(s: string): string {
  if (s === 'draft') return 'draft';
  if (s === 'hospital_selected' || s === 'completed') return 'closed';
  return 'submitted';
}

function userIdFromToken(req: NextRequest): string {
  const token = (req.headers.get('authorization') ?? '').replace('Bearer ', '');
  // mock-access-test@test.com → u-001
  return token.startsWith('mock-access-') ? 'u-001' : 'u-001';
}

export async function GET(req: NextRequest) {
  const concerns = getConcerns();
  const proposals = getProposals();

  const proposalCounts = proposals.reduce<Record<string, number>>((acc, p) => {
    acc[p.concernId] = (acc[p.concernId] ?? 0) + 1;
    return acc;
  }, {});

  const userId = userIdFromToken(req);
  const filtered = concerns.filter(c => c.userId === userId);

  const items = filtered.map(c => ({
    id: c.id,
    status: toWireStatus(c.status),
    source: c.source,
    description: c.description,
    primaryArea: c.primaryArea,
    bodyAreas: c.bodyAreas,
    bodyAreaDetail: c.bodyAreaDetail,
    budgetMin: c.budgetMin,
    budgetMax: c.budgetMax,
    visitDateFrom: c.visitDateFrom,
    visitDateTo: c.visitDateTo,
    proposalCount: proposalCounts[c.id] ?? 0,
    createdAt: c.createdAt,
    updatedAt: c.updatedAt,
  }));

  return NextResponse.json({
    success: true,
    data: { concerns: items, total: items.length, page: 1, limit: 20 },
  });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const userId = userIdFromToken(req);
  const now = new Date().toISOString();
  const id = `c-${Date.now()}`;

  const areas = (body.areas ?? ['기타']) as string[];
  const primaryArea = areas[0] ?? '기타';

  const concern: Concern = {
    id,
    userId,
    status: 'draft',
    source: (body.source ?? 'organic') as Concern['source'],
    bodyAreas: areas as Concern['bodyAreas'],
    primaryArea: primaryArea as Concern['primaryArea'],
    bodyArea: primaryArea as Concern['bodyArea'],
    bodyAreaDetail: body.detail ?? null,
    description: body.description ?? '',
    budgetMin: body.budgetMin ?? null,
    budgetMax: body.budgetMax ?? null,
    visitDateFrom: body.visitDateFrom ?? null,
    visitDateTo: body.visitDateTo ?? null,
    hasPassport: false,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
  };

  addConcern(concern);
  return NextResponse.json({ success: true, data: { id } }, { status: 201 });
}

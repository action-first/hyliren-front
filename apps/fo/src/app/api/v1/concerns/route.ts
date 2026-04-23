import { NextRequest, NextResponse } from 'next/server';
import { getConcerns, addConcern, getProposals } from '@hyliren/shared/src/server/data-store';
import type { Concern } from '@hyliren/shared';
import { requireUserId } from '@/lib/server/auth';
import { parseJson, validateBody, isResponse } from '@/lib/server/http';
import { createConcernSchema } from '@/server/schemas/concern';

function toWireStatus(s: string): string {
  if (s === 'draft') return 'draft';
  if (s === 'hospital_selected' || s === 'completed') return 'closed';
  return 'submitted';
}

export async function GET(req: NextRequest) {
  const auth = requireUserId(req);
  if (isResponse(auth)) return auth;

  const concerns = getConcerns();
  const proposals = getProposals();

  const proposalCounts = proposals.reduce<Record<string, number>>((acc, p) => {
    acc[p.concernId] = (acc[p.concernId] ?? 0) + 1;
    return acc;
  }, {});

  const filtered = concerns.filter(c => c.userId === auth.userId);

  // List item wire — rawNarrative/aiSummary/feedbackTurns 는 상세 조회에서만 노출.
  // 목록 응답을 가볍게 유지.
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
  const auth = requireUserId(req);
  if (isResponse(auth)) return auth;

  const raw = await parseJson(req);
  if (isResponse(raw)) return raw;

  const input = validateBody(createConcernSchema, raw);
  if (isResponse(input)) return input;

  const now = new Date().toISOString();
  const id = `c-${Date.now()}`;

  /*
   * Real backend (concern.service.ts) 동작을 미러링:
   *   primaryArea: createDto.areas?.[0] || '기타'
   *   bodyAreas:   createDto.areas || []
   *
   * - areas 미지정/빈 배열이어도 400 반환하지 않음 (DTO @IsOptional)
   * - bodyAreas 는 빈 배열로 저장 (프론트 mapper 가 읽기 시 '기타' 로 정규화)
   * - unknown enum 값도 정규화 없이 원본 그대로 저장 (DB jsonb 컬럼)
   */
  const rawAreas = input.areas ?? [];
  const bodyAreas = rawAreas as Concern['bodyAreas'];
  const primaryArea = (rawAreas[0] ?? '기타') as Concern['primaryArea'];

  const source = (input.source ?? 'organic') as Concern['source'];

  const concern: Concern = {
    id,
    userId: auth.userId,
    status: 'draft',
    source,
    bodyAreas,
    primaryArea,
    bodyArea: primaryArea,
    bodyAreaDetail: input.detail ?? null,
    description: input.description,
    // rawNarrative 미지정 시 description 값을 그대로 원문으로 저장 (DB 기본 동작 가정).
    rawNarrative: input.rawNarrative ?? input.description,
    aiSummary: input.aiSummary ?? null,
    feedbackTurns: input.feedbackTurns ?? [],
    budgetMin: input.budgetMin ?? null,
    budgetMax: input.budgetMax ?? null,
    visitDateFrom: input.visitDateFrom ?? null,
    visitDateTo: input.visitDateTo ?? null,
    hasPassport: false,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
  };

  addConcern(concern);
  return NextResponse.json({ success: true, data: { id } }, { status: 201 });
}

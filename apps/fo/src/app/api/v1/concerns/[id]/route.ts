import { NextRequest, NextResponse } from 'next/server';
import {
  getConcernById,
  getConcernPhotos,
  getProposals,
  updateConcern,
} from '@hyliren/shared/src/server/data-store';
import type { Concern } from '@hyliren/shared';
import { requireUserId } from '@/lib/server/auth';
import { parseJson, validateBody, isResponse } from '@/lib/server/http';
import { updateConcernSchema } from '@/server/schemas/concern';

function toWireStatus(s: string): string {
  if (s === 'draft') return 'draft';
  if (s === 'hospital_selected' || s === 'completed') return 'closed';
  return 'submitted';
}

function notFound(): NextResponse {
  return NextResponse.json(
    { success: false, statusCode: 404, message: 'Not found' },
    { status: 404 },
  );
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = requireUserId(req);
  if (isResponse(auth)) return auth;

  const { id } = await params;
  const concern = getConcernById(id);
  if (!concern || concern.userId !== auth.userId) {
    return notFound();
  }

  const photos = getConcernPhotos()
    .filter(p => p.concernId === id)
    .map(p => ({ id: p.id, url: p.url, sortOrder: p.sortOrder }));

  const proposals = getProposals().filter(p => p.concernId === id);
  const proposalCount = proposals.length;

  const selectedProposal = concern.status === 'hospital_selected'
    ? proposals.find(p => p.status === 'selected')
    : null;

  return NextResponse.json({
    success: true,
    data: {
      id: concern.id,
      userId: concern.userId,
      status: toWireStatus(concern.status),
      source: concern.source,
      description: concern.description,
      rawNarrative: concern.rawNarrative ?? null,
      primaryArea: concern.primaryArea,
      bodyAreas: concern.bodyAreas,
      bodyAreaDetail: concern.bodyAreaDetail,
      hasPassport: concern.hasPassport,
      aiSummary: concern.aiSummary ?? null,
      feedbackTurns: concern.feedbackTurns ?? [],
      budgetMin: concern.budgetMin,
      budgetMax: concern.budgetMax,
      visitDateFrom: concern.visitDateFrom,
      visitDateTo: concern.visitDateTo,
      proposalCount,
      createdAt: concern.createdAt,
      updatedAt: concern.updatedAt,
      deletedAt: concern.deletedAt,
      photos,
      selectedHospital: selectedProposal
        ? { id: selectedProposal.memberId, proposalId: selectedProposal.id, selectedAt: concern.updatedAt }
        : null,
    },
  });
}

/**
 * PATCH — yj.jung 의 `UpdateConcernBody` 가 허용하는 필드만 업데이트한다
 * (description, budgetMin, budgetMax, visitDateFrom, visitDateTo).
 * 기타 필드는 strict 스키마에서 거부된다.
 *
 * Real backend (concern.service.ts) 는 DRAFT 상태가 아닌 concern 을
 * "Concern must be in draft status" 메시지와 함께 404 로 거부한다.
 * 동일 동작을 유지한다.
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = requireUserId(req);
  if (isResponse(auth)) return auth;

  const { id } = await params;
  const existing = getConcernById(id);
  if (!existing || existing.userId !== auth.userId) {
    return notFound();
  }
  if (existing.status !== 'draft') {
    return NextResponse.json(
      { success: false, statusCode: 404, message: 'Concern must be in draft status' },
      { status: 404 },
    );
  }

  const raw = await parseJson(req);
  if (isResponse(raw)) return raw;

  const input = validateBody(updateConcernSchema, raw);
  if (isResponse(input)) return input;

  const now = new Date().toISOString();
  const updates: Partial<Concern> = { updatedAt: now };

  if (input.description !== undefined) updates.description = input.description;
  if (input.budgetMin !== undefined) updates.budgetMin = input.budgetMin ?? null;
  if (input.budgetMax !== undefined) updates.budgetMax = input.budgetMax ?? null;
  if (input.visitDateFrom !== undefined) updates.visitDateFrom = input.visitDateFrom ?? null;
  if (input.visitDateTo !== undefined) updates.visitDateTo = input.visitDateTo ?? null;

  updateConcern(id, updates);
  return NextResponse.json({ success: true });
}

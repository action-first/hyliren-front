import { NextRequest, NextResponse } from 'next/server';
import {
  getConcernById,
  getProposalById,
  getProposals,
  updateConcern,
  updateProposal,
} from '@hyliren/shared/src/server/data-store';
import { requireUserId } from '@/lib/server/auth';
import { parseJson, validateBody, isResponse } from '@/lib/server/http';
import { selectHospitalSchema } from '@/server/schemas/concern';

/**
 * Real backend (concern.service.ts):
 *   - hospital_selections 테이블에 concernId UNIQUE 제약
 *   - 이미 선택된 concern 에 재선택 시도 시 409 Conflict
 *     "Hospital already selected for this concern"
 *   - 성공 시 concern.status → CLOSED
 *   - proposal.status 는 백엔드에서 건드리지 않음
 *
 * Mock 도 동일 규칙을 따른다. 단 우리 data-store 에는 별도 selections
 * 테이블이 없으므로, "이미 선택됨" 판단은 `proposals.some(status==='selected')`
 * 로 대체한다. GET /concerns/[id] 가 selectedHospital 을 찾는 기존 방식과도 정합.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = requireUserId(req);
  if (isResponse(auth)) return auth;

  const { id: concernId } = await params;
  const concern = getConcernById(concernId);
  if (!concern || concern.userId !== auth.userId) {
    return NextResponse.json(
      { success: false, statusCode: 404, message: 'Not found' },
      { status: 404 },
    );
  }

  const raw = await parseJson(req);
  if (isResponse(raw)) return raw;

  const input = validateBody(selectHospitalSchema, raw);
  if (isResponse(input)) return input;

  const target = getProposalById(input.proposalId);
  if (!target || target.concernId !== concernId) {
    return NextResponse.json(
      { success: false, statusCode: 404, message: 'Proposal not found for this concern' },
      { status: 404 },
    );
  }

  const alreadySelected = getProposals().some(
    p => p.concernId === concernId && p.status === 'selected',
  );
  if (alreadySelected) {
    return NextResponse.json(
      { success: false, statusCode: 409, message: 'Hospital already selected for this concern' },
      { status: 409 },
    );
  }

  const now = new Date().toISOString();
  updateProposal(input.proposalId, { status: 'selected', updatedAt: now });
  updateConcern(concernId, { status: 'hospital_selected', updatedAt: now });

  return NextResponse.json({
    success: true,
    data: { id: concernId, proposalId: input.proposalId },
  });
}

import { z } from 'zod';
import { isNarrativeQualityEnough } from '@/lib/consult/narrative-quality';

/**
 * 스키마는 yj.jung의 client type contract(`apps/fo/src/lib/api/concern/types.ts`)를
 * 정본으로 삼아 그대로 미러링한다. 우리(mock layer)는 해당 contract의 소비자/시뮬레이터다.
 *
 * - `CreateConcernBody`: description만 required, 나머지 optional, areas/source는 `string[]`/`string`
 * - `UpdateConcernBody`: description, budgetMin/Max, visitDateFrom/To 만 허용
 *
 * 추가로 지키는 것:
 *  - .strict() 로 mass assignment 차단 (userId/id/status 주입 금지)
 *  - description max 5000, 음수 예산 금지 등 어떤 백엔드라도 가질 위생 수준 검증
 *  - 날짜·예산 크로스필드 refine (min ≤ max)
 *  - bodyAreas 의 enum 제약은 서버가 강제하지 않고, 클라이언트 mapper(`toBodyArea`)가 '기타'로 정규화한다 — yj.jung 설계 존중
 */

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'ERR_DATE_FORMAT');
const nonNegInt = z.number().int().nonnegative();
const photoRef = z.string().min(1).max(2048);

const feedbackTurnSchema = z.object({
  role: z.enum(['user', 'ai']),
  message: z.string().min(1).max(5000),
});

export const createConcernSchema = z
  .object({
    description: z
      .string()
      .trim()
      .min(1, 'ERR_NARRATIVE_REQUIRED')
      .max(5000)
      // concern-analysis 와 동일한 언어별 품질 refine 을 서버 측에서도 강제.
      // 클라이언트 우회 호출 (curl/Postman) 및 이모지·공백 남발 방지.
      .refine(isNarrativeQualityEnough, {
        message: 'ERR_NARRATIVE_TOO_SHORT',
      }),
    // 고객 최초 입력 원문. description 이 AI 정제본이면 rawNarrative 는 원본 보존.
    // DB concerns.raw_narrative 에 대응.
    rawNarrative: z.string().trim().max(5000).optional(),
    areas: z.array(z.string().min(1).max(20)).max(10).optional(),
    detail: z.string().trim().max(500).optional(),
    budgetMin: nonNegInt.optional(),
    budgetMax: nonNegInt.optional(),
    visitDateFrom: isoDate.optional(),
    visitDateTo: isoDate.optional(),
    photos: z.array(photoRef).max(3).optional(),
    source: z.string().min(1).max(32).optional(),
    // AI 분석 결과 전체 JSON. DB concerns.ai_summary (JSONB) 에 대응.
    aiSummary: z.record(z.string(), z.unknown()).optional(),
    // AI 상담 대화 히스토리. DB concerns.feedback_turns 에 JSONB 배열로 저장.
    feedbackTurns: z.array(feedbackTurnSchema).max(50).optional(),
  })
  .strict()
  .refine(
    (v) => v.budgetMin == null || v.budgetMax == null || v.budgetMin <= v.budgetMax,
    { message: 'ERR_BUDGET_MIN_GT_MAX', path: ['budgetMin'] },
  )
  .refine(
    (v) => v.visitDateFrom == null || v.visitDateTo == null || v.visitDateFrom <= v.visitDateTo,
    { message: 'ERR_VISIT_DATE_FROM_GT_TO', path: ['visitDateFrom'] },
  );

export const updateConcernSchema = z
  .object({
    description: z.string().trim().min(1).max(5000).optional(),
    budgetMin: nonNegInt.nullable().optional(),
    budgetMax: nonNegInt.nullable().optional(),
    visitDateFrom: isoDate.nullable().optional(),
    visitDateTo: isoDate.nullable().optional(),
  })
  .strict()
  .refine(
    (v) => v.budgetMin == null || v.budgetMax == null || v.budgetMin <= v.budgetMax,
    { message: 'ERR_BUDGET_MIN_GT_MAX', path: ['budgetMin'] },
  )
  .refine(
    (v) => v.visitDateFrom == null || v.visitDateTo == null || v.visitDateFrom <= v.visitDateTo,
    { message: 'ERR_VISIT_DATE_FROM_GT_TO', path: ['visitDateFrom'] },
  );

export const selectHospitalSchema = z
  .object({
    proposalId: z.string().regex(/^p-[a-zA-Z0-9_-]{1,48}$/, 'ERR_INVALID_PROPOSAL_ID'),
  })
  .strict();

export const paymentSchema = z
  .object({
    type: z.enum(['credit_charge', 'report_purchase', 'service_purchase']),
    amount: z.number().int().positive().max(100_000_000),
    currency: z.string().length(3),
    actorType: z.enum(['buyer', 'partner']),
    actorId: z.string().min(1).max(64),
    actorName: z.string().min(1).max(100).optional(),
    relatedId: z.string().min(1).max(64).optional(),
    status: z.enum(['paid', 'pending', 'refunded']),
  })
  .strict();

export type CreateConcernInput = z.infer<typeof createConcernSchema>;
export type UpdateConcernInput = z.infer<typeof updateConcernSchema>;
export type SelectHospitalInput = z.infer<typeof selectHospitalSchema>;
export type PaymentInput = z.infer<typeof paymentSchema>;

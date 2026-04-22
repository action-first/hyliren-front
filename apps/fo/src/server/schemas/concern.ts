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

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, '날짜는 YYYY-MM-DD 형식이어야 합니다');
const nonNegInt = z.number().int().nonnegative();
const photoRef = z.string().min(1).max(2048);

export const createConcernSchema = z
  .object({
    description: z
      .string()
      .trim()
      .min(1, '고민을 입력해주세요')
      .max(5000)
      // concern-analysis 와 동일한 언어별 품질 refine 을 서버 측에서도 강제.
      // 클라이언트 우회 호출 (curl/Postman) 및 이모지·공백 남발 방지.
      .refine(isNarrativeQualityEnough, {
        message: '어느 부위가 어떻게 고민이신지 조금 더 구체적으로 알려주세요',
      }),
    areas: z.array(z.string().min(1).max(20)).max(10).optional(),
    detail: z.string().trim().max(500).optional(),
    budgetMin: nonNegInt.optional(),
    budgetMax: nonNegInt.optional(),
    visitDateFrom: isoDate.optional(),
    visitDateTo: isoDate.optional(),
    photos: z.array(photoRef).max(3).optional(),
    source: z.string().min(1).max(32).optional(),
  })
  .strict()
  .refine(
    (v) => v.budgetMin == null || v.budgetMax == null || v.budgetMin <= v.budgetMax,
    { message: 'budgetMin은 budgetMax보다 작거나 같아야 합니다', path: ['budgetMin'] },
  )
  .refine(
    (v) => v.visitDateFrom == null || v.visitDateTo == null || v.visitDateFrom <= v.visitDateTo,
    { message: 'visitDateFrom은 visitDateTo보다 이전이어야 합니다', path: ['visitDateFrom'] },
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
    { message: 'budgetMin은 budgetMax보다 작거나 같아야 합니다', path: ['budgetMin'] },
  )
  .refine(
    (v) => v.visitDateFrom == null || v.visitDateTo == null || v.visitDateFrom <= v.visitDateTo,
    { message: 'visitDateFrom은 visitDateTo보다 이전이어야 합니다', path: ['visitDateFrom'] },
  );

export const selectHospitalSchema = z
  .object({
    proposalId: z.string().regex(/^p-[a-zA-Z0-9_-]{1,48}$/, '유효한 제안서 ID가 아닙니다'),
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

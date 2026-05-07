import { z } from 'zod';
import { isNarrativeQualityEnough } from '@/lib/consult/narrative-quality';

export const feedbackTurnSchema = z.object({
  role: z.enum(['user', 'ai']),
  message: z.string().min(1),
});

/**
 * Zod refine/min/max message 는 stable ERR_* code 만 반환.
 * FE caller (route handler) 가 code → t('error.<code>') 매핑.
 */
export const analysisRequestSchema = z.object({
  photos: z
    .array(z.string().url().or(z.string().startsWith('/')).or(z.string().startsWith('blob:')))
    .max(3, 'ERR_PHOTOS_TOO_MANY')
    .default([]),
  narrative: z
    .string()
    .min(1, 'ERR_NARRATIVE_REQUIRED')
    // 언어별 의미 밀도를 고려한 품질 점수(한자 2, 한글 1, 라틴 0.5). 이모지/공백만 입력 차단, 중국어 5자도 통과.
    .refine(isNarrativeQualityEnough, {
      message: 'ERR_NARRATIVE_TOO_SHORT',
    }),
  feedbackTurns: z
    .array(feedbackTurnSchema)
    .optional()
    .default([]),
});

export type ValidatedRequest = z.infer<typeof analysisRequestSchema>;

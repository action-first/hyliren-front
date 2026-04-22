import { z } from 'zod';
import { isNarrativeQualityEnough } from '@/lib/consult/narrative-quality';

export const feedbackTurnSchema = z.object({
  role: z.enum(['user', 'ai']),
  message: z.string().min(1),
});

export const analysisRequestSchema = z.object({
  photos: z
    .array(z.string().url().or(z.string().startsWith('/')).or(z.string().startsWith('blob:')))
    .max(3, '사진은 최대 3장까지 가능합니다')
    .default([]),
  narrative: z
    .string()
    .min(1, '고민을 입력해주세요')
    // 언어별 의미 밀도를 고려한 품질 점수(한자 2, 한글 1, 라틴 0.5). 이모지/공백만 입력 차단, 중국어 5자도 통과.
    .refine(isNarrativeQualityEnough, {
      message: '어느 부위가 어떻게 고민이신지 조금 더 구체적으로 알려주세요',
    }),
  feedbackTurns: z
    .array(feedbackTurnSchema)
    .optional()
    .default([]),
});

export type ValidatedRequest = z.infer<typeof analysisRequestSchema>;

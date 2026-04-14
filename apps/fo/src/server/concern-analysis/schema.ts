import { z } from 'zod';

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
    .min(10, '고민을 10자 이상 입력해주세요'),
  feedbackTurns: z
    .array(feedbackTurnSchema)
    .optional()
    .default([]),
});

export type ValidatedRequest = z.infer<typeof analysisRequestSchema>;

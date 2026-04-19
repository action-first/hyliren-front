import { z } from 'zod';
import { CONCERN_STATUSES, CONCERN_SOURCES, BODY_AREAS } from '@hyliren/shared';

export const createConcernSchema = z.object({
  id: z.string().min(1, 'id는 필수입니다'),
  userId: z.string().min(1, 'userId는 필수입니다'),
  status: z.enum(CONCERN_STATUSES),
  source: z.enum(CONCERN_SOURCES),
  bodyAreas: z.array(z.enum(BODY_AREAS)).min(1, '부위를 최소 1개 선택하세요'),
  primaryArea: z.enum(BODY_AREAS),
  bodyArea: z.enum(BODY_AREAS),
  bodyAreaDetail: z.string().nullable().optional().default(null),
  description: z.string().min(1, '고민 설명은 필수입니다'),
  budgetMin: z.number().nullable().optional().default(null),
  budgetMax: z.number().nullable().optional().default(null),
  visitDateFrom: z.string().nullable().optional().default(null),
  visitDateTo: z.string().nullable().optional().default(null),
  hasPassport: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
  deletedAt: z.string().nullable().optional().default(null),
});

export type CreateConcernInput = z.infer<typeof createConcernSchema>;

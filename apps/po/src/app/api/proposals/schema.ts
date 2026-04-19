import { z } from 'zod';
import { ANESTHESIA_TYPES } from '@hyliren/shared';

const proposalItemSchema = z.object({
  name: z.string().min(1, '시술명은 필수입니다'),
  nameZh: z.string().optional(),
  price: z.number().min(0, '가격은 0 이상이어야 합니다'),
});

export const createProposalSchema = z.object({
  concernId: z.string().min(1, 'concernId는 필수입니다'),
  memberId: z.string().min(1, 'memberId는 필수입니다'),
  items: z.array(proposalItemSchema).min(1, '시술 항목이 최소 1개 필요합니다'),
  totalPrice: z.number().positive('총 가격은 0보다 커야 합니다'),
  recoveryDays: z.number().int().min(0, '회복일은 0 이상이어야 합니다'),
  anesthesiaType: z.enum(ANESTHESIA_TYPES),
  hospitalStayDays: z.number().int().min(0).optional().default(0),
  availableDateFrom: z.string().nullable().optional().default(null),
  availableDateTo: z.string().nullable().optional().default(null),
  consultationNote: z.string().nullable().optional().default(null),
  creditsCharged: z.number().int().min(0).optional().default(3),
});

export type CreateProposalInput = z.infer<typeof createProposalSchema>;

import { z } from 'zod';
import {
  BODY_AREAS, PROCEDURE_TYPES, PROCEDURE_STATUSES, ANESTHESIA_TYPES,
} from '@hyliren/shared/src/constants';

const bodyAreaEnum = z.enum(BODY_AREAS);
const procedureTypeEnum = z.enum(PROCEDURE_TYPES);
const procedureStatusEnum = z.enum(PROCEDURE_STATUSES);
const anesthesiaEnum = z.enum(ANESTHESIA_TYPES);

/** Step 1 + 2 + 3 + 최소 variant 1개를 포함한 생성 스키마. */
export const createProcedureSchema = z.object({
  memberId: z.string().min(1),

  /* Procedure (Step 1) */
  title: z.string().min(2).max(80),
  titleZh: z.string().min(2).max(80),
  primaryArea: bodyAreaEnum,
  procedureType: procedureTypeEnum,
  heroImageUrl: z.string().url().or(z.literal('')),
  slug: z.string().min(3).max(120).regex(/^[a-z0-9-]+$/).optional(),

  /* Detail (Step 2, 3) */
  description: z.string().max(2000),
  descriptionZh: z.string().max(2000),
  indications: z.array(z.string().min(1).max(30)).max(5).default([]),
  precautions: z.string().max(500),
  precautionsZh: z.string().max(500),
  galleryImageUrls: z.array(z.string().url()).max(8).default([]),

  /* Base 값 (Step 2) */
  basePrice: z.number().int().positive(),
  baseAnesthesia: anesthesiaEnum,
  baseDurationMinutes: z.number().int().min(1).max(480),
  baseRecoveryDays: z.number().int().min(0).max(90),
  baseHospitalStayDays: z.number().int().min(0).max(30),

  /* Variants — 최소 1개 필수, isDefault 정확히 1개 */
  variants: z.array(z.object({
    name: z.string().min(1).max(50),
    nameZh: z.string().min(1).max(50),
    description: z.string().max(500).nullable().optional(),
    descriptionZh: z.string().max(500).nullable().optional(),
    price: z.number().int().positive().nullable().optional(),
    anesthesia: anesthesiaEnum.nullable().optional(),
    durationMinutes: z.number().int().min(1).max(480).nullable().optional(),
    recoveryDays: z.number().int().min(0).max(90).nullable().optional(),
    hospitalStayDays: z.number().int().min(0).max(30).nullable().optional(),
    sortOrder: z.number().int().min(0).default(0),
    isDefault: z.boolean().default(false),
  })).min(1).refine(
    vs => vs.filter(v => v.isDefault).length === 1,
    { message: '대표(default) 옵션은 정확히 1개여야 합니다' },
  ),

  status: procedureStatusEnum.default('draft'),
});

export type CreateProcedureInput = z.infer<typeof createProcedureSchema>;

/** 부분 업데이트 — 어떤 필드든 변경 가능. Procedure + Detail 동시 수정 허용. */
export const updateProcedureSchema = z.object({
  // Procedure 쪽
  title: z.string().min(2).max(80).optional(),
  titleZh: z.string().min(2).max(80).optional(),
  primaryArea: bodyAreaEnum.optional(),
  procedureType: procedureTypeEnum.optional(),
  heroImageUrl: z.string().url().optional(),
  slug: z.string().min(3).max(120).regex(/^[a-z0-9-]+$/).optional(),
  status: procedureStatusEnum.optional(),

  // Detail 쪽
  description: z.string().max(2000).optional(),
  descriptionZh: z.string().max(2000).optional(),
  indications: z.array(z.string().min(1).max(30)).max(5).optional(),
  precautions: z.string().max(500).optional(),
  precautionsZh: z.string().max(500).optional(),
  galleryImageUrls: z.array(z.string().url()).max(8).optional(),
  basePrice: z.number().int().positive().optional(),
  baseAnesthesia: anesthesiaEnum.optional(),
  baseDurationMinutes: z.number().int().min(1).max(480).optional(),
  baseRecoveryDays: z.number().int().min(0).max(90).optional(),
  baseHospitalStayDays: z.number().int().min(0).max(30).optional(),
});

export type UpdateProcedureInput = z.infer<typeof updateProcedureSchema>;

export const variantSchema = z.object({
  name: z.string().min(1).max(50),
  nameZh: z.string().min(1).max(50),
  description: z.string().max(500).nullable().optional(),
  descriptionZh: z.string().max(500).nullable().optional(),
  price: z.number().int().positive().nullable().optional(),
  anesthesia: anesthesiaEnum.nullable().optional(),
  durationMinutes: z.number().int().min(1).max(480).nullable().optional(),
  recoveryDays: z.number().int().min(0).max(90).nullable().optional(),
  hospitalStayDays: z.number().int().min(0).max(30).nullable().optional(),
  sortOrder: z.number().int().min(0).default(0),
  isDefault: z.boolean().default(false),
});

export type VariantInput = z.infer<typeof variantSchema>;

/** slug 자동 생성 (한국어 title 을 로마자로 변환하진 않고 procedureType 기반) */
export function generateSlug(procedureType: string): string {
  const base = procedureType.replace(/_/g, '-');
  const suffix = Math.random().toString(36).slice(2, 8);
  return `${base}-${suffix}`;
}

import { z } from 'zod';
import {
  BODY_AREAS, PROCEDURE_TYPES, PROCEDURE_STATUSES,
  ANESTHESIA_TYPES, LOCALES,
} from '@hyliren/shared/src/constants';

const bodyAreaEnum = z.enum(BODY_AREAS);
const procedureTypeEnum = z.enum(PROCEDURE_TYPES);
const procedureStatusEnum = z.enum(PROCEDURE_STATUSES);
const anesthesiaEnum = z.enum(ANESTHESIA_TYPES);
const localeEnum = z.enum(LOCALES);

/** Procedure 의 locale 별 번역 블럭. */
const procedureI18nBlock = z.object({
  title: z.string().min(2).max(80),
  description: z.string().max(2000),
  precautions: z.string().max(500),
  indications: z.array(z.string().min(1).max(30)).max(5),
});

/** Variant 의 locale 별 번역 블럭. */
const variantI18nBlock = z.object({
  name: z.string().min(1).max(50),
  description: z.string().max(500).nullable(),
});

/**
 * i18n 객체 — locale → block 매핑. 최소 1개 locale 필수.
 * Zod 4 의 z.record(enum, schema) 는 모든 enum 키를 필수로 강제하므로
 * partialRecord 사용 — 키는 LOCALES 중 일부만 있어도 허용.
 */
const procedureI18nSchema = z.partialRecord(localeEnum, procedureI18nBlock)
  .refine(
    obj => Object.keys(obj).length >= 1,
    { message: '최소 1개 언어 번역이 필요합니다' },
  );

const variantI18nSchema = z.partialRecord(localeEnum, variantI18nBlock)
  .refine(
    obj => Object.keys(obj).length >= 1,
    { message: '최소 1개 언어 번역이 필요합니다' },
  );

/** Variant 입력 스키마 (생성/수정 공통). */
export const variantSchema = z.object({
  price: z.number().int().positive().nullable().optional(),
  anesthesia: anesthesiaEnum.nullable().optional(),
  durationMinutes: z.number().int().min(1).max(480).nullable().optional(),
  recoveryDays: z.number().int().min(0).max(90).nullable().optional(),
  hospitalStayDays: z.number().int().min(0).max(30).nullable().optional(),
  sortOrder: z.number().int().min(0).default(0),
  isDefault: z.boolean().default(false),
  i18n: variantI18nSchema,
});

export type VariantInput = z.infer<typeof variantSchema>;

/** 생성 스키마 — Procedure + 최소 1개 Variant 동시 저장. */
export const createProcedureSchema = z.object({
  memberId: z.string().min(1),

  /* Base 식별·분류·미디어 */
  slug: z.string().min(3).max(120).regex(/^[a-z0-9-]+$/).optional(),
  primaryArea: bodyAreaEnum,
  procedureType: procedureTypeEnum,
  heroImageUrl: z.string().url().or(z.literal('')),
  galleryImageUrls: z.array(z.string().url()).max(8).default([]),

  /* Base 값 (variant 승계 기준) */
  basePrice: z.number().int().positive(),
  baseAnesthesia: anesthesiaEnum,
  baseDurationMinutes: z.number().int().min(1).max(480),
  baseRecoveryDays: z.number().int().min(0).max(90),
  baseHospitalStayDays: z.number().int().min(0).max(30),

  /* 원본 언어 + 번역 블럭들 */
  sourceLocale: localeEnum.default('ko'),
  i18n: procedureI18nSchema,

  /* Variants (최소 1개, isDefault 정확히 1개) */
  variants: z.array(variantSchema).min(1).refine(
    vs => vs.filter(v => v.isDefault).length === 1,
    { message: '대표(default) 옵션은 정확히 1개여야 합니다' },
  ),

  status: procedureStatusEnum.default('draft'),
});

export type CreateProcedureInput = z.infer<typeof createProcedureSchema>;

/**
 * 부분 업데이트. procedure 본체 필드 + i18n 부분 병합 지원.
 * i18n 은 locale 단위로 upsert — 예: `{ i18n: { 'zh-CN': {...} } }` 전달 시
 * 기존 ko·ja 는 유지하고 zh-CN 만 덮어씀.
 */
export const updateProcedureSchema = z.object({
  slug: z.string().min(3).max(120).regex(/^[a-z0-9-]+$/).optional(),
  primaryArea: bodyAreaEnum.optional(),
  procedureType: procedureTypeEnum.optional(),
  heroImageUrl: z.string().url().optional(),
  galleryImageUrls: z.array(z.string().url()).max(8).optional(),
  status: procedureStatusEnum.optional(),

  basePrice: z.number().int().positive().optional(),
  baseAnesthesia: anesthesiaEnum.optional(),
  baseDurationMinutes: z.number().int().min(1).max(480).optional(),
  baseRecoveryDays: z.number().int().min(0).max(90).optional(),
  baseHospitalStayDays: z.number().int().min(0).max(30).optional(),

  /** 전달된 locale 만 upsert. 생략된 locale 은 유지. */
  i18n: z.partialRecord(localeEnum, procedureI18nBlock).optional(),
});

export type UpdateProcedureInput = z.infer<typeof updateProcedureSchema>;

/** Variant 부분 업데이트. i18n 도 locale 단위 upsert. */
export const updateVariantSchema = z.object({
  price: z.number().int().positive().nullable().optional(),
  anesthesia: anesthesiaEnum.nullable().optional(),
  durationMinutes: z.number().int().min(1).max(480).nullable().optional(),
  recoveryDays: z.number().int().min(0).max(90).nullable().optional(),
  hospitalStayDays: z.number().int().min(0).max(30).nullable().optional(),
  sortOrder: z.number().int().min(0).optional(),
  isDefault: z.boolean().optional(),
  i18n: z.partialRecord(localeEnum, variantI18nBlock).optional(),
});

export type UpdateVariantInput = z.infer<typeof updateVariantSchema>;

/** slug 자동 생성 (procedureType 기반, 한국어 title 을 로마자로 변환하진 않음) */
export function generateSlug(procedureType: string): string {
  const base = procedureType.replace(/_/g, '-');
  const suffix = Math.random().toString(36).slice(2, 8);
  return `${base}-${suffix}`;
}

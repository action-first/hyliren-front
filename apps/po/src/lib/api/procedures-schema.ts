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

/**
 * Procedure 의 locale 별 번역 블럭.
 *
 * draft 저장을 지원하기 위해 title/name 의 min 제약은 서버에서 제거하고
 * 공개 전환 시에만 superRefine 으로 강제 (아래 createProcedureSchema).
 */
const procedureI18nBlock = z.object({
  title: z.string().max(80),
  description: z.string().max(2000),
  precautions: z.string().max(500),
  indications: z.array(z.string().min(1).max(30)).max(5),
});

/** Variant 의 locale 별 번역 블럭. */
const variantI18nBlock = z.object({
  name: z.string().max(50),
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
    { message: 'ERR_AT_LEAST_ONE_LOCALE' },
  );

const variantI18nSchema = z.partialRecord(localeEnum, variantI18nBlock)
  .refine(
    obj => Object.keys(obj).length >= 1,
    { message: 'ERR_AT_LEAST_ONE_LOCALE' },
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

/**
 * 생성 스키마 — Procedure + 최소 1개 Variant 동시 저장.
 *
 * D1: draft 저장은 분류(primaryArea/procedureType)와 원본 타이틀만 있으면 허용.
 * 가격·이미지·variant name 등 나머지 필수 조건은 status='published' 로 공개할 때만 강제.
 */
export const createProcedureSchema = z.object({
  // memberId 제거됨 — backend 가 JWT 의 req.user.memberId 를 자동 주입.
  // body 에 보내면 partner CreateProcedureRequestDto whitelist 위반 (400).

  /* Base 식별·분류·미디어 */
  slug: z.string().min(3).max(120).regex(/^[a-z0-9-]+$/).optional(),
  primaryArea: bodyAreaEnum,
  procedureType: procedureTypeEnum,
  heroImageUrl: z.string().url().or(z.literal('')),
  galleryImageUrls: z.array(z.string().url()).max(8).default([]),

  /* Base 값 (variant 승계 기준) — draft 저장 허용 위해 basePrice 는 0 이상 */
  basePrice: z.number().int().min(0),
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
    { message: 'ERR_DEFAULT_VARIANT_REQUIRED' },
  ),

  status: procedureStatusEnum.default('draft'),
}).superRefine((data, ctx) => {
  // Zod refine message 는 stable ERR_* code — caller (form) 가 t('error.<code>') 매핑.
  // draft/published 공통 — 원본 언어 타이틀 최소 1자
  const src = data.i18n[data.sourceLocale];
  if (!src || (src.title ?? '').trim().length < 1) {
    ctx.addIssue({
      code: 'custom',
      path: ['i18n', data.sourceLocale, 'title'],
      message: 'ERR_SOURCE_TITLE_REQUIRED',
    });
    return;
  }

  // published 공개 조건 — draft 는 면제
  if (data.status === 'published') {
    if ((src.title ?? '').trim().length < 2) {
      ctx.addIssue({
        code: 'custom',
        path: ['i18n', data.sourceLocale, 'title'],
        message: 'ERR_PUBLISH_TITLE_TOO_SHORT',
      });
    }
    if (data.basePrice <= 0) {
      ctx.addIssue({
        code: 'custom',
        path: ['basePrice'],
        message: 'ERR_PUBLISH_PRICE_REQUIRED',
      });
    }
    if (!data.heroImageUrl) {
      ctx.addIssue({
        code: 'custom',
        path: ['heroImageUrl'],
        message: 'ERR_PUBLISH_HERO_REQUIRED',
      });
    }
    data.variants.forEach((v, i) => {
      const vSrc = v.i18n[data.sourceLocale];
      if (!vSrc || (vSrc.name ?? '').trim().length < 1) {
        ctx.addIssue({
          code: 'custom',
          path: ['variants', i, 'i18n', data.sourceLocale, 'name'],
          message: 'ERR_PUBLISH_VARIANT_NAME_REQUIRED',
        });
      }
    });
  }
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
  heroImageUrl: z.string().url().or(z.literal('')).optional(),
  galleryImageUrls: z.array(z.string().url()).max(8).optional(),
  status: procedureStatusEnum.optional(),

  /**
   * draft 편집 시 0 허용 (real 백엔드 UpdateProcedureRequestDto 와 동일 @Min(0)).
   * publish 전환 시의 > 0 제약은 route 레벨 publish-strict 에서 처리.
   */
  basePrice: z.number().int().min(0).optional(),
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

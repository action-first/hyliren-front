import type { ProcedureOption } from '../concern-analysis/types';

/**
 * Procedure Option Catalog (i18n QA P2 — i18n key shape).
 *
 * 정책: BE 는 번역 안 함. catalog 의 `name` / `descriptionTemplate` 은 i18n key string.
 * FE 컴포넌트가 `t(opt.name)` / `t(opt.description)` 으로 viewerLocale 매핑.
 *
 * bodyArea: BodyArea enum key (Stage 3 — eyes/nose/lifting/skin/diet/etc).
 * 자연어 콘텐츠는 packages/i18n/messages 의 `procedure.option.{key}.{name|description}` 키.
 */
export const PROCEDURE_OPTIONS: ProcedureOption[] = [
  /* ── 눈 (eyes) ── */
  {
    key: 'eye_non_incisional_ptosis',
    name: 'procedure.option.eye_non_incisional_ptosis.name',
    bodyArea: 'eyes',
    descriptionTemplate: 'procedure.option.eye_non_incisional_ptosis.description',
  },
  {
    key: 'forehead_lift',
    name: 'procedure.option.forehead_lift.name',
    bodyArea: 'eyes',
    descriptionTemplate: 'procedure.option.forehead_lift.description',
  },
  {
    key: 'eye_buried_suture',
    name: 'procedure.option.eye_buried_suture.name',
    bodyArea: 'eyes',
    descriptionTemplate: 'procedure.option.eye_buried_suture.description',
  },
  {
    key: 'eye_partial_incision',
    name: 'procedure.option.eye_partial_incision.name',
    bodyArea: 'eyes',
    descriptionTemplate: 'procedure.option.eye_partial_incision.description',
  },
  {
    key: 'eye_full_incision',
    name: 'procedure.option.eye_full_incision.name',
    bodyArea: 'eyes',
    descriptionTemplate: 'procedure.option.eye_full_incision.description',
  },
  {
    key: 'under_eye_fat_repositioning',
    name: 'procedure.option.under_eye_fat_repositioning.name',
    bodyArea: 'eyes',
    descriptionTemplate: 'procedure.option.under_eye_fat_repositioning.description',
  },
  {
    key: 'lower_blepharoplasty',
    name: 'procedure.option.lower_blepharoplasty.name',
    bodyArea: 'eyes',
    descriptionTemplate: 'procedure.option.lower_blepharoplasty.description',
  },

  /* ── 코 (nose) ── */
  {
    key: 'nose_tip',
    name: 'procedure.option.nose_tip.name',
    bodyArea: 'nose',
    descriptionTemplate: 'procedure.option.nose_tip.description',
  },
  {
    key: 'nose_autologous_cartilage',
    name: 'procedure.option.nose_autologous_cartilage.name',
    bodyArea: 'nose',
    descriptionTemplate: 'procedure.option.nose_autologous_cartilage.description',
  },
  {
    key: 'nose_bridge_implant',
    name: 'procedure.option.nose_bridge_implant.name',
    bodyArea: 'nose',
    descriptionTemplate: 'procedure.option.nose_bridge_implant.description',
  },

  /* ── 리프팅 (lifting) ── */
  {
    key: 'thread_lift',
    name: 'procedure.option.thread_lift.name',
    bodyArea: 'lifting',
    descriptionTemplate: 'procedure.option.thread_lift.description',
  },
  {
    key: 'ulthera',
    name: 'procedure.option.ulthera.name',
    bodyArea: 'lifting',
    descriptionTemplate: 'procedure.option.ulthera.description',
  },
  {
    key: 'hifu',
    name: 'procedure.option.hifu.name',
    bodyArea: 'lifting',
    descriptionTemplate: 'procedure.option.hifu.description',
  },
  {
    key: 'facial_contouring',
    name: 'procedure.option.facial_contouring.name',
    bodyArea: 'lifting',
    descriptionTemplate: 'procedure.option.facial_contouring.description',
  },

  /* ── 피부 (skin) ── */
  {
    key: 'laser_toning',
    name: 'procedure.option.laser_toning.name',
    bodyArea: 'skin',
    descriptionTemplate: 'procedure.option.laser_toning.description',
  },
  {
    key: 'fraxel',
    name: 'procedure.option.fraxel.name',
    bodyArea: 'skin',
    descriptionTemplate: 'procedure.option.fraxel.description',
  },

  /* ── 다이어트 (diet) ── */
  {
    key: 'liposuction',
    name: 'procedure.option.liposuction.name',
    bodyArea: 'diet',
    descriptionTemplate: 'procedure.option.liposuction.description',
  },
];

/** Lookup helper */
export function getOptionByKey(key: string): ProcedureOption | undefined {
  return PROCEDURE_OPTIONS.find(o => o.key === key);
}

import type { Locale } from '@hyliren/shared';
import type { ProcedureI18n, ProcedureVariantI18n } from '@hyliren/shared';
import type { WizardForm, WizardVariant } from './types';

/** 각 step 의 진행 가능 여부 (다음 버튼 활성화 판단용) */
export function stepIsValid(form: WizardForm, stepIndex: number): boolean {
  switch (stepIndex) {
    case 0:
      return (
        form.primaryArea !== '' &&
        form.procedureType !== '' &&
        form.heroImageUrl.trim() !== '' &&
        (form.i18n[form.sourceLocale]?.title?.trim() ?? '') !== ''
      );
    case 1:
      return (
        form.basePrice > 0 &&
        form.baseDurationMinutes > 0 &&
        form.variants.length >= 1 &&
        form.variants.filter(v => v.isDefault).length === 1 &&
        form.variants.every(v =>
          (v.i18n[form.sourceLocale]?.name?.trim() ?? '') !== ''
        )
      );
    case 2: {
      const block = form.i18n[form.sourceLocale];
      return (
        (block?.description?.trim() ?? '') !== '' &&
        (block?.precautions?.trim() ?? '') !== ''
      );
    }
    case 3:
      return true;  // Step 4 는 미리보기 전용
    default:
      return false;
  }
}

export function allStepsValid(form: WizardForm): boolean {
  for (let i = 0; i < 3; i++) {
    if (!stepIsValid(form, i)) return false;
  }
  return true;
}

/**
 * Submit 직전에 i18n 객체를 정리 (C1).
 *
 * Step3 에서 사용자가 비소스 locale 탭을 전환하면 Step3Content 가 빈 block
 * `{ title: '', description: '', precautions: '', indications: [] }` 을 seed 할 수
 * 있다. title 이 비어있으면 서버 스키마 (title.min(2)) 에 걸려 저장이 차단된다.
 * 따라서 submit 전에 title 이 비어있는 비소스 locale 블록은 통째로 제거한다.
 *
 * 소스 locale 블록은 어떤 상태든 보존 (validation 이 막아주므로 여기서 손대지 않음).
 */
export function sanitizeProcedureI18n(
  i18n: Partial<Record<Locale, ProcedureI18n>>,
  sourceLocale: Locale,
): Partial<Record<Locale, ProcedureI18n>> {
  const cleaned: Partial<Record<Locale, ProcedureI18n>> = {};
  for (const [loc, block] of Object.entries(i18n) as [Locale, ProcedureI18n | undefined][]) {
    if (!block) continue;
    if (loc === sourceLocale) {
      cleaned[loc] = block;
      continue;
    }
    if ((block.title ?? '').trim().length >= 2) {
      cleaned[loc] = block;
    }
  }
  return cleaned;
}

/**
 * variant i18n 동일 — name 이 비어있는 비소스 locale 블록 제거.
 */
export function sanitizeVariantI18n(
  i18n: Partial<Record<Locale, ProcedureVariantI18n>>,
  sourceLocale: Locale,
): Partial<Record<Locale, ProcedureVariantI18n>> {
  const cleaned: Partial<Record<Locale, ProcedureVariantI18n>> = {};
  for (const [loc, block] of Object.entries(i18n) as [Locale, ProcedureVariantI18n | undefined][]) {
    if (!block) continue;
    if (loc === sourceLocale) {
      cleaned[loc] = block;
      continue;
    }
    if ((block.name ?? '').trim().length >= 1) {
      cleaned[loc] = block;
    }
  }
  return cleaned;
}

/** wizard 폼 전체를 submit 직전 상태로 sanitize. variants 내부 i18n 도 정리. */
export function sanitizeWizardForm(form: WizardForm): WizardForm {
  return {
    ...form,
    i18n: sanitizeProcedureI18n(form.i18n, form.sourceLocale),
    variants: form.variants.map<WizardVariant>(v => ({
      ...v,
      i18n: sanitizeVariantI18n(v.i18n, form.sourceLocale),
    })),
  };
}

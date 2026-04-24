import type { WizardForm } from './types';

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

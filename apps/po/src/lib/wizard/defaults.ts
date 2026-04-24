import type { WizardForm, WizardVariant } from './types';

/** 새 wizard 빈 상태. */
export function emptyWizardForm(): WizardForm {
  return {
    primaryArea: '',
    procedureType: '',
    heroImageUrl: '',
    slug: '',
    sourceLocale: 'ko',
    i18n: {
      ko: { title: '', description: '', precautions: '', indications: [] },
    },
    basePrice: 0,
    baseAnesthesia: 'local',
    baseDurationMinutes: 30,
    baseRecoveryDays: 7,
    baseHospitalStayDays: 0,
    variants: [emptyVariant(true)],
    galleryImageUrls: [],
    status: 'draft',
  };
}

export function emptyVariant(isDefault: boolean): WizardVariant {
  return {
    id: `new-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    isNew: true,
    price: null,
    anesthesia: null,
    durationMinutes: null,
    recoveryDays: null,
    hospitalStayDays: null,
    sortOrder: 0,
    isDefault,
    i18n: {
      ko: { name: '', description: null },
    },
  };
}

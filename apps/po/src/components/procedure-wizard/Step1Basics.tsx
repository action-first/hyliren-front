'use client';

import { useState } from 'react';
import { Input, Select } from '@hyliren/ui';
import { BODY_AREAS, proceduresByArea, PROCEDURE_TYPE_AREAS } from '@hyliren/shared';
import type { BodyArea, ProcedureType, Locale } from '@hyliren/shared';
import { LocaleTabs } from './LocaleTabs';
import { useLocaleStore } from '@/store/locale';
import type { WizardForm } from '@/lib/wizard/types';

interface Step1Props {
  form: WizardForm;
  onChange: (patch: Partial<WizardForm>) => void;
}

// BODY_AREA_OPTIONS — value 는 enum key, label 은 t() 로 활성 locale 기준 매핑.
// 컴포넌트 안에서 useMemo 로 t 의존성 갱신.

// procedureType 을 한국어 라벨로 표시 (enum value → 라벨)
const PROCEDURE_TYPE_LABEL: Record<ProcedureType, string> = {
  eye_double_eyelid: '눈 · 쌍꺼풀',
  eye_ptosis_correction: '눈 · 눈매교정',
  eye_under_eye_fat: '눈 · 눈밑지방 재배치',
  eye_lower_blepharoplasty: '눈 · 하안검',
  eye_epicanthoplasty: '눈 · 앞·뒤트임',
  eye_canthoplasty: '눈 · 외안각',
  eye_revision: '눈 · 재수술',
  nose_augmentation: '코 · 융비 · 콧대',
  nose_tip: '코 · 코끝',
  nose_revision: '코 · 재수술',
  nose_hump: '코 · 매부리',
  nose_short_correction: '코 · 짧은 코',
  nose_nostril: '코 · 콧볼 축소',
  lift_thread: '리프팅 · 실리프팅',
  lift_ulthera: '리프팅 · 울쎄라',
  lift_hifu: '리프팅 · HIFU',
  lift_face_lift: '리프팅 · 안면거상',
  lift_fat_graft: '리프팅 · 지방이식',
  contour_facial: '안면윤곽 · 광대',
  contour_mandible: '안면윤곽 · 양악',
  contour_chin: '안면윤곽 · 턱끝',
  skin_laser: '피부 · 레이저',
  skin_injection: '피부 · 주사 (보톡스·필러)',
  skin_peeling: '피부 · 필링',
  skin_acne: '피부 · 여드름',
  skin_pigmentation: '피부 · 색소·잡티',
  skin_scar: '피부 · 흉터',
  diet_liposuction: '다이어트 · 지방흡입',
  diet_injection: '다이어트 · 지방분해주사',
  diet_body_contouring: '다이어트 · 바디 윤곽',
  other: '기타',
};

/** 선택된 부위에 속하는 시술만 옵션으로. 부위 미선택 시 빈 목록. */
function procedureOptionsForArea(area: BodyArea | ''): { value: string; label: string }[] {
  if (!area) return [];
  return proceduresByArea(area).map(t => ({
    value: t,
    label: PROCEDURE_TYPE_LABEL[t].replace(/^[^·]*·\s*/, ''), // 부위 prefix 제거
  }));
}

export function Step1Basics({ form, onChange }: Step1Props) {
  const t = useLocaleStore(s => s.t);
  const [activeLocale, setActiveLocale] = useState<Locale>(form.sourceLocale);

  const completed: Partial<Record<Locale, boolean>> = {};
  for (const [loc, block] of Object.entries(form.i18n)) {
    if (block?.title) completed[loc as Locale] = true;
  }

  const currentBlock = form.i18n[activeLocale] ?? {
    title: '', description: '', precautions: '', indications: [],
  };

  function updateTitle(title: string) {
    onChange({
      i18n: {
        ...form.i18n,
        [activeLocale]: { ...currentBlock, title },
      },
    });
  }

  /** 부위 변경 시, 기존 시술 유형이 새 부위에 속하지 않으면 초기화. */
  function changePrimaryArea(area: BodyArea) {
    const currentType = form.procedureType as ProcedureType | '';
    const belongsToArea = currentType && PROCEDURE_TYPE_AREAS[currentType] === area;
    onChange({
      primaryArea: area,
      procedureType: belongsToArea ? form.procedureType : '',
    });
  }

  const typeOptions = procedureOptionsForArea(form.primaryArea || '');

  // Smart default: procedureType 선택 시 title placeholder 에 해당 시술명 제안
  const procedureTypeSuggestion = form.procedureType
    ? PROCEDURE_TYPE_LABEL[form.procedureType as ProcedureType]?.replace(/^[^·]*·\s*/, '')
    : '';
  const titlePlaceholder = activeLocale === 'ko'
    ? (procedureTypeSuggestion
        ? t('po.wizardTitlePlaceholderSuggest', { suggestion: procedureTypeSuggestion })
        : t('po.wizardTitlePlaceholderKoDefault'))
    : activeLocale === 'zh-CN'
      ? t('po.wizardTitlePlaceholderZhCN')
      : activeLocale === 'ja'
        ? t('po.wizardTitlePlaceholderJa')
        : activeLocale === 'en'
          ? t('po.wizardTitlePlaceholderEn')
          : '';

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-3">
        <Select
          label={t('po.wizardBodyArea')}
          value={form.primaryArea || ''}
          options={[
            { value: '', label: t('po.wizardSelectPlaceholder') },
            ...BODY_AREAS.map(a => ({ value: a, label: t(`common.bodyArea.${a}`) })),
          ]}
          onChange={v => changePrimaryArea(v as BodyArea)}
        />
        <Select
          label={t('po.wizardProcedureType')}
          value={form.procedureType || ''}
          options={[
            { value: '', label: form.primaryArea ? t('po.wizardSelectPlaceholder') : t('po.wizardSelectAreaFirst') },
            ...typeOptions,
          ]}
          onChange={v => onChange({ procedureType: v as ProcedureType })}
        />
      </div>

      <div>
        <Input
          label={t('po.wizardHeroImageUrl')}
          value={form.heroImageUrl}
          onChange={e => onChange({ heroImageUrl: e.target.value })}
          placeholder="https://…"
        />
        <p className="text-[var(--app-text-micro)] text-[var(--text-disabled)] mt-1.5">
          {t('po.wizardHeroImageHelp')}
        </p>
        {form.heroImageUrl && (
          <div className="mt-3 w-full h-40 rounded-md overflow-hidden bg-[var(--surface-subdued)]">
            <img src={form.heroImageUrl} alt="" className="w-full h-full object-cover" />
          </div>
        )}
      </div>

      <div>
        <LocaleTabs
          active={activeLocale}
          sourceLocale={form.sourceLocale}
          completed={completed}
          onChange={setActiveLocale}
        />
        <Input
          label={t('po.wizardTitleField', {
            label: activeLocale === form.sourceLocale
              ? t('po.wizardTitleOriginal')
              : t('po.wizardTitleTranslation'),
          })}
          value={currentBlock.title}
          onChange={e => updateTitle(e.target.value)}
          placeholder={titlePlaceholder}
        />
        {activeLocale !== form.sourceLocale && !currentBlock.title && (
          <p className="text-[var(--app-text-micro)] text-[var(--text-disabled)] mt-1.5">
            {t('po.wizardTitleFallbackHint', { locale: form.sourceLocale })}
          </p>
        )}
      </div>

      <div>
        <Input
          label={t('po.wizardUrlSlug')}
          value={form.slug}
          onChange={e => onChange({ slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
          placeholder={t('po.wizardUrlSlugPlaceholder')}
        />
        <p className="text-[var(--app-text-micro)] text-[var(--text-disabled)] mt-1.5">
          {t('po.wizardUrlSlugHelp')}: /procedures/<strong>{form.slug || '...'}</strong>
        </p>
      </div>
    </div>
  );
}

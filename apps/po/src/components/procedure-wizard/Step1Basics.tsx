'use client';

import { useMemo, useState } from 'react';
import { Input, Select } from '@hyliren/ui';
import { BODY_AREAS, proceduresByArea, PROCEDURE_TYPE_AREAS } from '@hyliren/shared';
import type { BodyArea, ProcedureType, Locale } from '@hyliren/shared';
import { LocaleTabs } from './LocaleTabs';
import { HeroImageUploader } from './HeroImageUploader';
import { useLocaleStore } from '@/store/locale';
import type { WizardForm } from '@/lib/wizard/types';

interface Step1Props {
  form: WizardForm;
  onChange: (patch: Partial<WizardForm>) => void;
}

type TFn = (key: string, params?: Record<string, string | number>) => string;

/**
 * 선택된 부위에 속하는 시술만 옵션으로. 부위 미선택 시 빈 목록.
 * label 은 t('po.procedureType.<enum>') 로 활성 locale 매핑 — 정적 한국어 dict 폐기.
 * `^[^·]*·\s*` prefix 제거 (모든 로케일이 동일하게 `{area} · {detail}` 포맷 약속).
 */
function procedureOptionsForArea(area: BodyArea | '', t: TFn): { value: string; label: string }[] {
  if (!area) return [];
  return proceduresByArea(area).map(type => ({
    value: type,
    label: t(`po.procedureType.${type}`).replace(/^[^·]*·\s*/, ''),
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

  const typeOptions = useMemo(() => procedureOptionsForArea(form.primaryArea || '', t), [form.primaryArea, t]);

  // Smart default: procedureType 선택 시 title placeholder 에 해당 시술명 제안 (활성 locale 기준)
  const procedureTypeSuggestion = form.procedureType
    ? t(`po.procedureType.${form.procedureType}`).replace(/^[^·]*·\s*/, '')
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
        <label className="block text-[var(--text-xs)] font-semibold text-[var(--text-disabled)] mb-1.5">
          {t('po.wizardHeroImageUrl')}
        </label>
        <HeroImageUploader
          value={form.heroImageUrl || null}
          onChange={url => onChange({ heroImageUrl: url ?? '' })}
        />
        <p className="text-[var(--app-text-micro)] text-[var(--text-disabled)] mt-1.5">
          {t('po.wizardHeroImageHelp')}
        </p>
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

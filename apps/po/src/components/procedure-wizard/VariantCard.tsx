'use client';

import { useState } from 'react';
import { Input, Select, Textarea } from '@hyliren/ui';
import { Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { ANESTHESIA_TYPES, formatNumberWithComma, parseNumberFromInput } from '@hyliren/shared';
import type { AnesthesiaType, Locale } from '@hyliren/shared';
import { LocaleTabs } from './LocaleTabs';
import { useLocaleStore } from '@/store/locale';
import type { WizardVariant, WizardForm } from '@/lib/wizard/types';

interface VariantCardProps {
  variant: WizardVariant;
  sourceLocale: Locale;
  base: Pick<WizardForm, 'basePrice' | 'baseAnesthesia' | 'baseDurationMinutes' | 'baseRecoveryDays' | 'baseHospitalStayDays'>;
  canDelete: boolean;
  onChange: (patch: Partial<WizardVariant>) => void;
  onDelete: () => void;
  onSetDefault: () => void;
}

export function VariantCard({
  variant, sourceLocale, base, canDelete, onChange, onDelete, onSetDefault,
}: VariantCardProps) {
  const t = useLocaleStore(s => s.t);
  const ANESTHESIA_OPTIONS = [
    { value: 'local', label: t('po.wizardAnesthesiaLocal') },
    { value: 'sedation', label: t('po.wizardAnesthesiaSedation') },
    { value: 'general', label: t('po.wizardAnesthesiaGeneral') },
  ];
  const [activeLocale, setActiveLocale] = useState<Locale>(sourceLocale);
  const [showOverride, setShowOverride] = useState(
    // 한 필드라도 override 돼 있으면 펼쳐놓음
    variant.price !== null || variant.anesthesia !== null ||
    variant.durationMinutes !== null || variant.recoveryDays !== null ||
    variant.hospitalStayDays !== null,
  );

  const completed: Partial<Record<Locale, boolean>> = {};
  for (const [loc, block] of Object.entries(variant.i18n)) {
    if (block?.name) completed[loc as Locale] = true;
  }
  const block = variant.i18n[activeLocale] ?? { name: '', description: null };

  function updateI18n(patch: { name?: string; description?: string | null }) {
    onChange({
      i18n: {
        ...variant.i18n,
        [activeLocale]: { ...block, ...patch },
      },
    });
  }

  /**
   * override 토글 — OFF 하면 해당 variant 필드를 null 로 되돌려 base 승계.
   * ON 전환하면 현재 base 값을 초기치로 seed.
   */
  function setOverride(on: boolean) {
    setShowOverride(on);
    if (!on) {
      onChange({
        price: null, anesthesia: null,
        durationMinutes: null, recoveryDays: null, hospitalStayDays: null,
      });
    } else {
      onChange({
        price: variant.price ?? base.basePrice,
        anesthesia: variant.anesthesia ?? base.baseAnesthesia,
        durationMinutes: variant.durationMinutes ?? base.baseDurationMinutes,
        recoveryDays: variant.recoveryDays ?? base.baseRecoveryDays,
        hospitalStayDays: variant.hospitalStayDays ?? base.baseHospitalStayDays,
      });
    }
  }

  return (
    <div className={`
      rounded-lg border p-4 bg-white
      ${variant.isDefault
        ? 'border-[var(--interactive-default)] ring-2 ring-[var(--color-info-soft)]'
        : 'border-[var(--border-default)]'}
    `}>
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-1.5 text-[var(--text-xs)] cursor-pointer">
            <input
              type="radio"
              checked={variant.isDefault}
              onChange={onSetDefault}
              className="cursor-pointer"
            />
            {t('po.wizardVariantMain')}
          </label>
          {variant.isNew && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--color-warning-soft)] text-[var(--color-warning)]">
              {t('po.wizardVariantSavePending')}
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={onDelete}
          disabled={!canDelete}
          title={canDelete ? t('po.wizardVariantDeleteTooltip') : t('po.wizardVariantMinOneTooltip')}
          className={`
            p-1.5 rounded transition-colors
            ${canDelete
              ? 'text-[var(--text-disabled)] hover:text-[var(--color-danger)] hover:bg-[var(--color-danger-soft)]'
              : 'text-[var(--text-disabled)] opacity-40 cursor-not-allowed'}
          `}
        >
          <Trash2 size={14} />
        </button>
      </div>

      {/* 옵션명 (locale 탭) */}
      <LocaleTabs
        active={activeLocale}
        sourceLocale={sourceLocale}
        completed={completed}
        onChange={setActiveLocale}
      />
      <div className="grid gap-3">
        <Input
          label={t('po.wizardOptionName')}
          value={block.name}
          onChange={e => updateI18n({ name: e.target.value })}
          placeholder={activeLocale === 'ko' ? t('po.wizardOptionNamePlaceholderKo') : activeLocale === 'zh-CN' ? t('po.wizardOptionNamePlaceholderZh') : ''}
        />
        <Textarea
          label={t('po.wizardOptionDescription')}
          value={block.description ?? ''}
          onChange={e => updateI18n({ description: e.target.value || null })}
          rows={2}
          placeholder={t('po.wizardOptionDescriptionPlaceholder')}
        />
      </div>

      {/* Override 토글 */}
      <div className="mt-4 pt-4 border-t border-[var(--border-subdued)]">
        <button
          type="button"
          onClick={() => setOverride(!showOverride)}
          className="flex items-center gap-1.5 text-[var(--text-xs)] font-medium text-[var(--text-default)] hover:text-[var(--interactive-default)]"
        >
          {showOverride ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          {showOverride ? t('po.wizardUseOverride') : t('po.wizardUseDefault')}
        </button>

        {showOverride && (
          <div className="grid grid-cols-2 gap-3 mt-3">
            {/* 가격 — 콤마 포맷 + '원' inline */}
            <div className="input-wrapper">
              <label className="input-label">{t('po.wizardOverridePrice')}</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  inputMode="numeric"
                  value={variant.price !== null ? formatNumberWithComma(variant.price) : ''}
                  onChange={e => {
                    const v = parseNumberFromInput(e.target.value);
                    onChange({ price: e.target.value ? v : null });
                  }}
                  placeholder={t('po.wizardBasePlaceholder', { value: base.basePrice.toLocaleString('ko-KR') })}
                  className="input-field flex-1 text-right tabular-nums"
                />
                <span className="text-[var(--text-sm)] text-[var(--text-subdued)] flex-shrink-0">{t('po.wizardWonUnit')}</span>
              </div>
            </div>
            <Select
              label={t('po.wizardOverrideAnesthesia')}
              value={variant.anesthesia ?? base.baseAnesthesia}
              options={ANESTHESIA_OPTIONS}
              onChange={v => onChange({ anesthesia: v as AnesthesiaType })}
            />
            <Input
              label={t('po.wizardOverrideDuration')}
              type="number"
              value={variant.durationMinutes ?? ''}
              onChange={e => onChange({ durationMinutes: e.target.value ? Number(e.target.value) : null })}
              placeholder={t('po.wizardBasePlaceholder', { value: base.baseDurationMinutes })}
            />
            <Input
              label={t('po.wizardOverrideRecovery')}
              type="number"
              value={variant.recoveryDays ?? ''}
              onChange={e => onChange({ recoveryDays: e.target.value ? Number(e.target.value) : null })}
              placeholder={t('po.wizardBasePlaceholder', { value: base.baseRecoveryDays })}
            />
            <Input
              label={t('po.wizardOverrideHospitalStay')}
              type="number"
              value={variant.hospitalStayDays ?? ''}
              onChange={e => onChange({ hospitalStayDays: e.target.value ? Number(e.target.value) : null })}
              placeholder={t('po.wizardBasePlaceholder', { value: base.baseHospitalStayDays })}
            />
          </div>
        )}
      </div>
    </div>
  );
}

/** 사용되지 않는 import 경고 회피 — ANESTHESIA_TYPES 는 enum 체크용으로 이미 import 됨 */
void ANESTHESIA_TYPES;

'use client';

import { useState } from 'react';
import { Input, Select, Button, Textarea } from '@hyliren/ui';
import { Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { ANESTHESIA_TYPES } from '@hyliren/shared';
import type { AnesthesiaType, Locale } from '@hyliren/shared';
import { LocaleTabs } from './LocaleTabs';
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

const ANESTHESIA_OPTIONS = [
  { value: 'local', label: '부분마취' },
  { value: 'sedation', label: '수면마취' },
  { value: 'general', label: '전신마취' },
];

export function VariantCard({
  variant, sourceLocale, base, canDelete, onChange, onDelete, onSetDefault,
}: VariantCardProps) {
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
        ? 'border-[var(--color-primary)] ring-2 ring-[var(--color-primary-soft,#fde7e4)]'
        : 'border-[var(--color-border)]'}
    `}>
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-1.5 text-[12px] cursor-pointer">
            <input
              type="radio"
              checked={variant.isDefault}
              onChange={onSetDefault}
              className="cursor-pointer"
            />
            대표 옵션
          </label>
          {variant.isNew && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--color-warning-soft,#fef9c3)] text-[var(--color-warning-text,#854d0e)]">
              저장 대기
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={onDelete}
          disabled={!canDelete}
          title={canDelete ? '옵션 삭제' : '최소 1개 옵션은 유지해야 합니다'}
          className={`
            p-1.5 rounded transition-colors
            ${canDelete
              ? 'text-[var(--color-text-dim)] hover:text-[var(--color-danger)] hover:bg-[var(--color-danger-soft,#fef2f2)]'
              : 'text-[var(--color-text-dim)] opacity-40 cursor-not-allowed'}
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
          label="옵션명 *"
          value={block.name}
          onChange={e => updateI18n({ name: e.target.value })}
          placeholder={activeLocale === 'ko' ? '예: 매몰법' : activeLocale === 'zh-CN' ? '例: 埋线法' : ''}
        />
        <Textarea
          label="옵션 설명 (선택)"
          value={block.description ?? ''}
          onChange={e => updateI18n({ description: e.target.value || null })}
          rows={2}
          placeholder="옵션별 차별점이 있다면 적어주세요"
        />
      </div>

      {/* Override 토글 */}
      <div className="mt-4 pt-4 border-t border-[var(--color-border-light)]">
        <button
          type="button"
          onClick={() => setOverride(!showOverride)}
          className="flex items-center gap-1.5 text-[12px] font-medium text-[var(--color-text)] hover:text-[var(--color-primary)]"
        >
          {showOverride ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          {showOverride ? '개별 값 사용' : '기본값 사용 (기본값과 다르면 펼치기)'}
        </button>

        {showOverride && (
          <div className="grid grid-cols-2 gap-3 mt-3">
            <Input
              label="가격 (원)"
              type="number"
              value={variant.price ?? ''}
              onChange={e => onChange({ price: e.target.value ? Number(e.target.value) : null })}
              placeholder={`기본: ${base.basePrice.toLocaleString()}`}
            />
            <Select
              label="마취"
              value={variant.anesthesia ?? base.baseAnesthesia}
              options={ANESTHESIA_OPTIONS}
              onChange={v => onChange({ anesthesia: v as AnesthesiaType })}
            />
            <Input
              label="시술 시간 (분)"
              type="number"
              value={variant.durationMinutes ?? ''}
              onChange={e => onChange({ durationMinutes: e.target.value ? Number(e.target.value) : null })}
              placeholder={`기본: ${base.baseDurationMinutes}`}
            />
            <Input
              label="회복일"
              type="number"
              value={variant.recoveryDays ?? ''}
              onChange={e => onChange({ recoveryDays: e.target.value ? Number(e.target.value) : null })}
              placeholder={`기본: ${base.baseRecoveryDays}`}
            />
            <Input
              label="입원일"
              type="number"
              value={variant.hospitalStayDays ?? ''}
              onChange={e => onChange({ hospitalStayDays: e.target.value ? Number(e.target.value) : null })}
              placeholder={`기본: ${base.baseHospitalStayDays}`}
            />
          </div>
        )}
      </div>
    </div>
  );
}

/** 사용되지 않는 import 경고 회피 — ANESTHESIA_TYPES 는 enum 체크용으로 이미 import 됨 */
void ANESTHESIA_TYPES;

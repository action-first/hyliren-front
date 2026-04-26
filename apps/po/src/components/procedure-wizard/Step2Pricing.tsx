'use client';

import { Input, Select, Button, SectionHeader } from '@hyliren/ui';
import { Plus } from 'lucide-react';
import type { AnesthesiaType } from '@hyliren/shared';
import { formatNumberWithComma, parseNumberFromInput } from '@hyliren/shared';
import { VariantCard } from './VariantCard';
import { emptyVariant } from '@/lib/wizard/defaults';
import type { WizardForm, WizardVariant } from '@/lib/wizard/types';

interface Step2Props {
  form: WizardForm;
  onChange: (patch: Partial<WizardForm>) => void;
}

const ANESTHESIA_OPTIONS = [
  { value: 'local', label: '부분마취' },
  { value: 'sedation', label: '수면마취' },
  { value: 'general', label: '전신마취' },
];

export function Step2Pricing({ form, onChange }: Step2Props) {
  function updateVariant(id: string, patch: Partial<WizardVariant>) {
    onChange({
      variants: form.variants.map(v => v.id === id ? { ...v, ...patch } : v),
    });
  }

  function deleteVariant(id: string) {
    const target = form.variants.find(v => v.id === id);
    const remaining = form.variants.filter(v => v.id !== id);

    // default variant 를 삭제하면 첫 남은 variant 로 자동 승계 — 서버 DELETE 가드와 동작 맞춤
    if (target?.isDefault && remaining.length > 0) {
      remaining[0] = { ...remaining[0], isDefault: true };
    }

    onChange({ variants: remaining });
  }

  function setDefault(id: string) {
    onChange({
      variants: form.variants.map(v => ({ ...v, isDefault: v.id === id })),
    });
  }

  function addVariant() {
    const maxSortOrder = form.variants.reduce((m, v) => Math.max(m, v.sortOrder), 0);
    const nv = emptyVariant(form.variants.length === 0);
    nv.sortOrder = maxSortOrder + 10;
    onChange({ variants: [...form.variants, nv] });
  }

  return (
    <div className="flex flex-col gap-6">
      {/* 기본값 */}
      <div>
        <SectionHeader
          title="기본값"
          subtitle="모든 옵션이 공통으로 갖는 시술 정보입니다. 옵션별로 다른 값이 필요하면 아래 옵션 카드에서 개별 설정할 수 있습니다."
        />
        <div className="grid grid-cols-2 gap-3 mt-3">
          {/* 기본 가격 — 콤마 포맷 + '원' 단위 inline */}
          <div className="input-wrapper">
            <label className="input-label">기본 가격 *</label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                inputMode="numeric"
                value={formatNumberWithComma(form.basePrice)}
                onChange={e => onChange({ basePrice: parseNumberFromInput(e.target.value) })}
                placeholder="0"
                className="input-field flex-1 text-right tabular-nums"
              />
              <span className="text-[var(--text-sm)] text-[var(--text-subdued)] flex-shrink-0">원</span>
            </div>
          </div>
          <Select
            label="기본 마취 *"
            value={form.baseAnesthesia}
            options={ANESTHESIA_OPTIONS}
            onChange={v => onChange({ baseAnesthesia: v as AnesthesiaType })}
          />
          <Input
            label="기본 시술 시간 (분) *"
            type="number"
            value={form.baseDurationMinutes || ''}
            onChange={e => onChange({ baseDurationMinutes: Number(e.target.value) || 0 })}
          />
          <Input
            label="기본 회복일 *"
            type="number"
            value={form.baseRecoveryDays}
            onChange={e => onChange({ baseRecoveryDays: Number(e.target.value) || 0 })}
          />
          <Input
            label="기본 입원일 *"
            type="number"
            value={form.baseHospitalStayDays}
            onChange={e => onChange({ baseHospitalStayDays: Number(e.target.value) || 0 })}
          />
        </div>
      </div>

      {/* Variants */}
      <div>
        <SectionHeader
          title="시술 옵션"
          subtitle="같은 시술의 여러 변형을 등록합니다. 예: 쌍꺼풀 → 매몰 / 부분절개 / 절개. 최소 1개 등록, 대표 옵션 1개를 지정해주세요."
          action={
            <Button variant="secondary" size="sm" onClick={addVariant}>
              <Plus size={13} /> 옵션 추가
            </Button>
          }
        />
        <div className="flex flex-col gap-3 mt-3">
          {form.variants
            .slice()
            .sort((a, b) => a.sortOrder - b.sortOrder)
            .map(v => (
              <VariantCard
                key={v.id}
                variant={v}
                sourceLocale={form.sourceLocale}
                base={form}
                canDelete={form.variants.length > 1}
                onChange={patch => updateVariant(v.id, patch)}
                onDelete={() => deleteVariant(v.id)}
                onSetDefault={() => setDefault(v.id)}
              />
            ))}
        </div>
      </div>
    </div>
  );
}

'use client';

import { Input, Select, Button } from '@hyliren/ui';
import { Plus } from 'lucide-react';
import type { AnesthesiaType } from '@hyliren/shared';
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
    onChange({
      variants: form.variants.filter(v => v.id !== id),
    });
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
      <section>
        <h2 className="text-[14px] font-bold text-[var(--color-text)] mb-1">기본값</h2>
        <p className="text-[12px] text-[var(--color-text-dim)] mb-3">
          옵션마다 다른 값이 필요하면 각 옵션 카드에서 개별 설정할 수 있습니다.
        </p>
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="기본 가격 (원) *"
            type="number"
            value={form.basePrice || ''}
            onChange={e => onChange({ basePrice: Number(e.target.value) || 0 })}
            placeholder="예: 1500000"
          />
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
      </section>

      {/* Variants */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-[14px] font-bold text-[var(--color-text)]">시술 옵션</h2>
            <p className="text-[12px] text-[var(--color-text-dim)] mt-0.5">
              예: 쌍꺼풀 → 매몰/부분절개/절개. 최소 1개, 대표 옵션 1개 선택.
            </p>
          </div>
          <Button variant="secondary" size="sm" onClick={addVariant}>
            <Plus size={13} /> 옵션 추가
          </Button>
        </div>

        <div className="flex flex-col gap-3">
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
      </section>
    </div>
  );
}

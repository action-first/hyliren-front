'use client';

import { Button } from '@hyliren/ui';
import { ArrowRight, ArrowLeft, Check } from 'lucide-react';
import { useConcernFlowStore, BUDGET_LABEL_KEYS, type BudgetRange } from '@/store/concern-flow';
import { useLocaleStore } from '@/store/locale';

const BUDGET_OPTIONS: { key: BudgetRange; subKey: string }[] = [
  { key: 'under100', subKey: 'consult.budgetUnder100Hint' },
  { key: '100to300', subKey: 'consult.budget100to300Hint' },
  { key: '300to500', subKey: 'consult.budget300to500Hint' },
  { key: 'over500', subKey: 'consult.budgetOver500Hint' },
];

export function StepBudget() {
  const { budgetRange, setBudgetRange, setStep } = useConcernFlowStore();
  const t = useLocaleStore(s => s.t);

  return (
    <div className="flex flex-col px-5 pt-6 pb-10">
      <button
        type="button"
        onClick={() => setStep('narrative')}
        className="flex items-center gap-1 text-[12px] text-[var(--color-text-dim)] bg-transparent border-0 cursor-pointer p-0 mb-4"
      >
        <ArrowLeft size={14} /> {t('consult.previous')}
      </button>

      <h1 className="text-[1.25rem] font-bold text-[var(--color-text)] leading-tight mb-1">
        {t('consult.budgetTitle')}
      </h1>
      <p className="text-[13px] text-[var(--color-text-dim)] mb-6">
        {t('consult.budgetDesc')}
      </p>

      <div className="flex flex-col gap-2 mb-4">
        {BUDGET_OPTIONS.map(opt => {
          const selected = budgetRange === opt.key;
          return (
            <button
              key={opt.key}
              type="button"
              onClick={() => setBudgetRange(opt.key)}
              className={`flex items-center gap-3 px-4 py-3.5 rounded-[var(--app-radius)] border-0 cursor-pointer transition-all text-left ${
                selected
                  ? 'bg-[var(--color-primary-soft)] ring-2 ring-[var(--color-primary)]'
                  : 'bg-[var(--color-bg)]'
              }`}
              style={!selected ? { boxShadow: 'var(--app-shadow-card-sm)' } : undefined}
            >
              <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                selected ? 'bg-[var(--color-primary)] text-white' : 'border-2 border-[var(--color-border-light)]'
              }`}>
                {selected && <Check size={12} strokeWidth={3} />}
              </div>
              <div className="flex-1">
                <span className={`text-[14px] block ${selected ? 'font-bold text-[var(--color-primary)]' : 'font-medium text-[var(--color-text)]'}`}>
                  {t(BUDGET_LABEL_KEYS[opt.key])}
                </span>
                <span className="text-[11px] text-[var(--color-text-dim)]">{t(opt.subKey)}</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* 미정 — 보조 선택지 */}
      <button
        type="button"
        onClick={() => setBudgetRange('undecided')}
        className={`text-[13px] py-2 mb-6 bg-transparent border-0 cursor-pointer ${
          budgetRange === 'undecided' ? 'font-bold text-[var(--color-primary)]' : 'text-[var(--color-text-dim)]'
        }`}
      >
        {t('consult.budgetUndecided')}
      </button>

      <Button
        variant="primary"
        size="lg"
        fullWidth
        disabled={!budgetRange}
        onClick={() => setStep('visit-plan')}
      >
        {t('common.next')} <ArrowRight size={16} />
      </Button>
    </div>
  );
}

'use client';

import { Button } from '@hyliren/ui';
import { ArrowRight, ArrowLeft, Check } from 'lucide-react';
import { useConcernFlowStore, BUDGET_LABELS, type BudgetRange } from '@/store/concern-flow';

const BUDGET_OPTIONS: { key: BudgetRange; sub: string }[] = [
  { key: 'under100', sub: '간단한 시술 위주' },
  { key: '100to300', sub: '가장 많이 선택하는 범위' },
  { key: '300to500', sub: '복합 시술 포함' },
  { key: 'over500', sub: '수술 + 복합 구성' },
];

export function StepBudget() {
  const { budgetRange, setBudgetRange, setStep } = useConcernFlowStore();

  return (
    <div className="flex flex-col px-5 pt-6 pb-10">
      <button
        type="button"
        onClick={() => setStep('narrative')}
        className="flex items-center gap-1 text-[12px] text-[var(--color-text-dim)] bg-transparent border-0 cursor-pointer p-0 mb-4"
      >
        <ArrowLeft size={14} /> 이전
      </button>

      <h1 className="text-[1.25rem] font-bold text-[var(--color-text)] leading-tight mb-1">
        예산은 대략 어느 범위예요?
      </h1>
      <p className="text-[13px] text-[var(--color-text-dim)] mb-6">
        정확하지 않아도 괜찮아요, 병원이 참고할 수 있는 범위면 충분해요
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
                  {BUDGET_LABELS[opt.key]}
                </span>
                <span className="text-[11px] text-[var(--color-text-dim)]">{opt.sub}</span>
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
        아직 정해진 예산은 없어요
      </button>

      <Button
        variant="accent"
        size="lg"
        fullWidth
        disabled={!budgetRange}
        onClick={() => setStep('visit-plan')}
      >
        다음 <ArrowRight size={16} />
      </Button>
    </div>
  );
}

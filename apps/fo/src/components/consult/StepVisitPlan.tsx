'use client';

import { Button } from '@hyliren/ui';
import { ArrowRight, ArrowLeft, Check } from 'lucide-react';
import { useConcernFlowStore, VISIT_TIMING_LABELS, STAY_DURATION_LABELS, type VisitTiming, type StayDuration } from '@/store/concern-flow';
import { useLocaleStore } from '@/store/locale';

const TIMING_OPTIONS: { key: VisitTiming; subKey: string }[] = [
  { key: 'within1m', subKey: 'consult.visitWithin1mHint' },
  { key: 'within3m', subKey: 'consult.visitWithin3mHint' },
  { key: 'within6m', subKey: 'consult.visitWithin6mHint' },
];

const STAY_OPTIONS: { key: StayDuration; subKey: string }[] = [
  { key: 'under3d', subKey: 'consult.stayUnder3dHint' },
  { key: '5to7d', subKey: 'consult.stay5to7dHint' },
  { key: '2weeks', subKey: 'consult.stay2weeksHint' },
];

type T = (key: string, params?: Record<string, string | number>) => string;

function SelectionGroup<T_ extends string>({
  title,
  options,
  labels,
  selected,
  onSelect,
  undecidedLabel,
  t,
}: {
  title: string;
  options: { key: T_; subKey: string }[];
  labels: Record<T_, string>;
  selected: T_ | null;
  onSelect: (key: T_) => void;
  undecidedLabel: string;
  t: T;
}) {
  return (
    <div className="mb-6">
      <h2 className="text-[14px] font-semibold text-[var(--color-text)] mb-3">{title}</h2>
      <div className="flex flex-col gap-2 mb-2">
        {options.map(opt => {
          const isSelected = selected === opt.key;
          return (
            <button
              key={opt.key}
              type="button"
              onClick={() => onSelect(opt.key)}
              className={`flex items-center gap-3 px-4 py-3 rounded-[var(--app-radius)] border-0 cursor-pointer transition-all text-left ${
                isSelected
                  ? 'bg-[var(--color-primary-soft)] ring-2 ring-[var(--color-primary)]'
                  : 'bg-[var(--color-bg)]'
              }`}
              style={!isSelected ? { boxShadow: 'var(--app-shadow-card-sm)' } : undefined}
            >
              <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                isSelected ? 'bg-[var(--color-primary)] text-white' : 'border-2 border-[var(--color-border-light)]'
              }`}>
                {isSelected && <Check size={12} strokeWidth={3} />}
              </div>
              <div className="flex-1">
                <span className={`text-[13px] block ${isSelected ? 'font-bold text-[var(--color-primary)]' : 'font-medium text-[var(--color-text)]'}`}>
                  {labels[opt.key]}
                </span>
                <span className="text-[11px] text-[var(--color-text-dim)]">{t(opt.subKey)}</span>
              </div>
            </button>
          );
        })}
      </div>
      <button
        type="button"
        onClick={() => onSelect('undecided' as T_)}
        className={`text-[12px] py-1 bg-transparent border-0 cursor-pointer ${
          selected === 'undecided' ? 'font-bold text-[var(--color-primary)]' : 'text-[var(--color-text-dim)]'
        }`}
      >
        {undecidedLabel}
      </button>
    </div>
  );
}

export function StepVisitPlan() {
  const { visitTiming, stayDuration, setVisitTiming, setStayDuration, setStep } = useConcernFlowStore();
  const t = useLocaleStore(s => s.t);

  const canProceed = visitTiming && stayDuration;

  return (
    <div className="flex flex-col px-5 pt-6 pb-10">
      <button
        type="button"
        onClick={() => setStep('budget')}
        className="flex items-center gap-1 text-[12px] text-[var(--color-text-dim)] bg-transparent border-0 cursor-pointer p-0 mb-4"
      >
        <ArrowLeft size={14} /> {t('consult.previous')}
      </button>

      <h1 className="text-[1.25rem] font-bold text-[var(--color-text)] leading-tight mb-1">
        {t('consult.visitPlanPageTitle')}
      </h1>
      <p className="text-[13px] text-[var(--color-text-dim)] mb-6">
        {t('consult.visitPlanPageDesc')}
      </p>

      <SelectionGroup
        title={t('consult.visitTitle')}
        options={TIMING_OPTIONS}
        labels={VISIT_TIMING_LABELS}
        selected={visitTiming}
        onSelect={setVisitTiming}
        undecidedLabel={t('consult.visitUndecided')}
        t={t}
      />

      <SelectionGroup
        title={t('consult.stayTitle')}
        options={STAY_OPTIONS}
        labels={STAY_DURATION_LABELS}
        selected={stayDuration}
        onSelect={setStayDuration}
        undecidedLabel={t('consult.stayUndecided')}
        t={t}
      />

      <Button
        variant="primary"
        size="lg"
        fullWidth
        disabled={!canProceed}
        onClick={() => setStep('processing')}
      >
        {t('consult.aiAnalysisStart')} <ArrowRight size={16} />
      </Button>
    </div>
  );
}

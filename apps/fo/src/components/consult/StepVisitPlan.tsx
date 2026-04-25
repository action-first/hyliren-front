'use client';

import { Button } from '@hyliren/ui';
import { ArrowRight, ArrowLeft, Check } from 'lucide-react';
import { useConcernFlowStore, VISIT_TIMING_LABELS, STAY_DURATION_LABELS, type VisitTiming, type StayDuration } from '@/store/concern-flow';

const TIMING_OPTIONS: { key: VisitTiming; sub: string }[] = [
  { key: 'within1m', sub: '곧 방문 예정' },
  { key: 'within3m', sub: '준비 중' },
  { key: 'within6m', sub: '계획 단계' },
];

const STAY_OPTIONS: { key: StayDuration; sub: string }[] = [
  { key: 'under3d', sub: '간단한 시술' },
  { key: '5to7d', sub: '일반적인 수술' },
  { key: '2weeks', sub: '수술 + 회복' },
];

function SelectionGroup<T extends string>({
  title,
  options,
  labels,
  selected,
  onSelect,
  undecidedLabel,
}: {
  title: string;
  options: { key: T; sub: string }[];
  labels: Record<T, string>;
  selected: T | null;
  onSelect: (key: T) => void;
  undecidedLabel: string;
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
                <span className="text-[11px] text-[var(--color-text-dim)]">{opt.sub}</span>
              </div>
            </button>
          );
        })}
      </div>
      <button
        type="button"
        onClick={() => onSelect('undecided' as T)}
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

  const canProceed = visitTiming && stayDuration;

  return (
    <div className="flex flex-col px-5 pt-6 pb-10">
      <button
        type="button"
        onClick={() => setStep('budget')}
        className="flex items-center gap-1 text-[12px] text-[var(--color-text-dim)] bg-transparent border-0 cursor-pointer p-0 mb-4"
      >
        <ArrowLeft size={14} /> 이전
      </button>

      <h1 className="text-[1.25rem] font-bold text-[var(--color-text)] leading-tight mb-1">
        방문 계획이 있으신가요?
      </h1>
      <p className="text-[13px] text-[var(--color-text-dim)] mb-6">
        일정에 맞는 시술을 제안받을 수 있어요
      </p>

      <SelectionGroup
        title="방문 시기"
        options={TIMING_OPTIONS}
        labels={VISIT_TIMING_LABELS}
        selected={visitTiming}
        onSelect={setVisitTiming}
        undecidedLabel="아직 시기는 정하지 않았어요"
      />

      <SelectionGroup
        title="체류 기간"
        options={STAY_OPTIONS}
        labels={STAY_DURATION_LABELS}
        selected={stayDuration}
        onSelect={setStayDuration}
        undecidedLabel="아직 정하지 않았어요"
      />

      <Button
        variant="accent"
        size="lg"
        fullWidth
        disabled={!canProceed}
        onClick={() => setStep('processing')}
      >
        AI 분석 시작 <ArrowRight size={16} />
      </Button>
    </div>
  );
}

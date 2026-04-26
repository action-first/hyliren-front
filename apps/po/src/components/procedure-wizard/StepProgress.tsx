'use client';

import { Check } from 'lucide-react';

export interface StepDef {
  key: string;
  label: string;
  /** 해당 step 의 필수 입력이 채워졌는지 여부 */
  done?: boolean;
}

interface StepProgressProps {
  steps: StepDef[];
  activeIndex: number;
  onStepClick?: (index: number) => void;
}

export function StepProgress({ steps, activeIndex, onStepClick }: StepProgressProps) {
  return (
    <nav className="flex flex-col gap-0">
      {steps.map((step, i) => {
        const isActive = i === activeIndex;
        const isPast = i < activeIndex;
        const reachable = isPast || isActive;
        return (
          <button
            key={step.key}
            type="button"
            onClick={() => onStepClick?.(i)}
            disabled={!onStepClick}
            className={`
              flex items-center gap-3 px-3 py-2.5 rounded-md text-left transition-colors
              ${isActive
                ? 'bg-[var(--color-info-soft)] text-[var(--text-default)]'
                : reachable
                  ? 'text-[var(--text-default)] hover:bg-[var(--surface-default)]'
                  : 'text-[var(--text-disabled)]'}
              ${onStepClick ? 'cursor-pointer' : 'cursor-default'}
            `}
          >
            <span className={`
              flex items-center justify-center w-6 h-6 rounded-full text-[11px] font-semibold shrink-0
              ${isActive
                ? 'bg-[var(--interactive-default)] text-white'
                : step.done
                  ? 'bg-[var(--color-success)] text-white'
                  : 'bg-[var(--surface-subdued)] text-[var(--text-disabled)]'}
            `}>
              {step.done && !isActive ? <Check size={13} /> : i + 1}
            </span>
            <span className="text-[13px] font-medium">{step.label}</span>
          </button>
        );
      })}
    </nav>
  );
}

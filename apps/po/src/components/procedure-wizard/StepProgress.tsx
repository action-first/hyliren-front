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

/**
 * 가로형 스텝 인디케이터. Wizard 헤더 영역에 배치.
 * 숫자 원 + 라벨 + 사이를 잇는 progress line. 클릭 가능한 step 만 커서 포인터.
 */
export function StepProgress({ steps, activeIndex, onStepClick }: StepProgressProps) {
  return (
    <nav className="flex items-center gap-1 w-full">
      {steps.map((step, i) => {
        const isActive = i === activeIndex;
        const isPast = i < activeIndex;
        const clickable = Boolean(onStepClick) && (isPast || isActive || step.done);
        const isLast = i === steps.length - 1;

        return (
          <div key={step.key} className="flex items-center flex-1 min-w-0">
            <button
              type="button"
              onClick={() => clickable && onStepClick?.(i)}
              disabled={!clickable}
              className={`
                flex items-center gap-2 min-w-0 transition-colors
                ${clickable ? 'cursor-pointer' : 'cursor-default'}
              `}
            >
              <span className={`
                flex items-center justify-center w-7 h-7 rounded-full text-[12px] font-semibold shrink-0
                transition-colors
                ${isActive
                  ? 'bg-[var(--color-primary)] text-white'
                  : step.done
                    ? 'bg-[var(--color-success,#16a34a)] text-white'
                    : isPast
                      ? 'bg-[var(--color-primary-soft,#fde7e4)] text-[var(--color-primary)]'
                      : 'bg-[var(--color-bg-tertiary,#f3f4f6)] text-[var(--color-text-dim)]'}
              `}>
                {step.done && !isActive ? <Check size={14} /> : i + 1}
              </span>
              <span className={`
                text-[12px] font-medium truncate
                ${isActive
                  ? 'text-[var(--color-text)]'
                  : isPast || step.done
                    ? 'text-[var(--color-text)]'
                    : 'text-[var(--color-text-dim)]'}
              `}>
                {step.label}
              </span>
            </button>

            {!isLast && (
              <div className={`
                flex-1 h-px mx-3
                ${isPast ? 'bg-[var(--color-primary)]' : 'bg-[var(--color-border)]'}
              `} />
            )}
          </div>
        );
      })}
    </nav>
  );
}

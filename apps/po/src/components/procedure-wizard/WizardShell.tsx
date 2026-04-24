'use client';

import { Button } from '@hyliren/ui';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { StepProgress, type StepDef } from './StepProgress';

interface WizardShellProps {
  title: string;
  steps: StepDef[];
  activeIndex: number;
  onStepChange?: (index: number) => void;
  children: React.ReactNode;

  /** 헤더 우측 보조 액션 (예: 임시저장, 삭제) */
  actions?: React.ReactNode;
  /** 마지막 step 의 특수 CTA (예: 공개). 마지막 step 에서만 렌더. */
  primaryAction: {
    label: string;
    onClick: () => void;
    disabled?: boolean;
    loading?: boolean;
  };
  onPrev?: () => void;
  onNext?: () => void;
  nextDisabled?: boolean;
}

/**
 * Wizard 공통 레이아웃.
 *
 * 상단: 타이틀 + 헤더 액션 → 가로형 step progress
 * 중앙: step content (최대 폭 제한 단일 컬럼)
 * 하단: 이전 ↔ 다음/공개 — 우측 그룹핑으로 CTA hierarchy 명확화
 *
 * 이전 설계: 좌측 세로 stepper + footer 양끝 이전/다음 → 시각적으로 퍼져보임.
 * 스텝퍼를 헤더로 끌어올리고 footer CTA 를 우측에 모아 시선 동선 단순화.
 */
export function WizardShell({
  title, steps, activeIndex, onStepChange,
  children, actions,
  primaryAction, onPrev, onNext, nextDisabled,
}: WizardShellProps) {
  const isLast = activeIndex === steps.length - 1;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b border-[var(--color-border)] bg-white">
        <div className="flex items-center justify-between px-6 pt-4 pb-3">
          <h1 className="text-[16px] font-bold text-[var(--color-text)]">{title}</h1>
          <div className="flex items-center gap-2">{actions}</div>
        </div>
        <div className="px-6 pb-4">
          <StepProgress steps={steps} activeIndex={activeIndex} onStepClick={onStepChange} />
        </div>
      </div>

      {/* Body */}
      <main className="flex-1 overflow-y-auto p-6">
        <div className="max-w-[760px] mx-auto">
          {children}
        </div>
      </main>

      {/* Footer nav — 우측 그룹핑 */}
      <div className="flex items-center justify-end gap-2 px-6 py-3 border-t border-[var(--color-border)] bg-white">
        {activeIndex > 0 && (
          <Button variant="secondary" size="sm" onClick={onPrev} disabled={!onPrev}>
            <ArrowLeft size={13} /> 이전
          </Button>
        )}
        {!isLast && (
          <Button variant="accent" size="sm" onClick={onNext} disabled={nextDisabled}>
            다음 <ArrowRight size={13} />
          </Button>
        )}
        {isLast && (
          <Button
            variant="accent"
            size="sm"
            onClick={primaryAction.onClick}
            disabled={primaryAction.disabled || primaryAction.loading}
          >
            {primaryAction.loading ? '저장 중...' : primaryAction.label}
          </Button>
        )}
      </div>
    </div>
  );
}

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

  /** 우측 상단 보조 액션 (예: 임시저장, 삭제) */
  actions?: React.ReactNode;
  /** 하단 CTA — 마지막 step 은 '공개' 같은 특수 버튼 */
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
 * Wizard 페이지 공통 레이아웃.
 * 좌측: StepProgress · 중앙: step 컨텐츠 · 하단: nav actions.
 * 우측 실시간 preview 는 MVP 제외 — Step 4 에서 중앙 영역에 전체 preview 렌더.
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
      <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-border)]">
        <h1 className="text-[16px] font-bold text-[var(--color-text)]">{title}</h1>
        <div className="flex items-center gap-2">{actions}</div>
      </div>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">
        {/* 좌측 progress */}
        <aside className="w-[240px] shrink-0 border-r border-[var(--color-border)] p-3 bg-[var(--color-bg-secondary,#fafbfb)]">
          <StepProgress steps={steps} activeIndex={activeIndex} onStepClick={onStepChange} />
        </aside>

        {/* 중앙 폼 */}
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-[760px] mx-auto">
            {children}
          </div>
        </main>
      </div>

      {/* Footer nav */}
      <div className="flex items-center justify-between px-6 py-3 border-t border-[var(--color-border)] bg-white">
        <Button variant="secondary" size="sm" onClick={onPrev} disabled={!onPrev || activeIndex === 0}>
          <ArrowLeft size={13} /> 이전
        </Button>
        <div className="flex gap-2">
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
    </div>
  );
}

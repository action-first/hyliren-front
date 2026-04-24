'use client';

import { Button } from '@hyliren/ui';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';
import { StepProgress, type StepDef } from './StepProgress';

interface WizardShellProps {
  /** 페이지 상위 제목 — body header 의 작은 breadcrumb 로 노출 (제거하려면 '') */
  title: string;
  steps: StepDef[];
  activeIndex: number;
  onStepChange?: (index: number) => void;
  children: React.ReactNode;

  /** 임시저장·보관함 등 부가 액션. body header 우측 그룹에 포함. */
  actions?: React.ReactNode;
  /** 마지막 step 특수 CTA (공개). */
  primaryAction: {
    label: string;
    onClick: () => void;
    disabled?: boolean;
    loading?: boolean;
  };
  onPrev?: () => void;
  onNext?: () => void;
  nextDisabled?: boolean;

  /** 자동 저장 상태 인디케이터. 없으면 숨김. */
  saveStatus?: 'idle' | 'saving' | 'saved' | 'error';
  /** 마지막 저장 시각 (상대 표기용, `getTime()` 기준 ms). */
  savedAt?: number | null;
}

function formatSavedAgo(savedAt: number | null | undefined): string {
  if (!savedAt) return '';
  const diffSec = Math.floor((Date.now() - savedAt) / 1000);
  if (diffSec < 5) return '방금';
  if (diffSec < 60) return `${diffSec}초 전`;
  const mins = Math.floor(diffSec / 60);
  if (mins < 60) return `${mins}분 전`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}시간 전`;
  return '오래 전';
}

/**
 * Wizard 공통 레이아웃 — 2열 구조 + 통합 body header.
 *
 *   [Left Sidebar | Form column (단일 header: breadcrumb + step 제목 + 액션 + 저장상태)]
 *
 * 페이지 헤더 별도 없음 — breadcrumb 역할을 body header 좌상단 small text 가 담당.
 * Step 컨텐츠는 activeIndex 변경 시 fade-in 애니메이션으로 교체.
 */
export function WizardShell({
  title, steps, activeIndex, onStepChange,
  children, actions,
  primaryAction, onPrev, onNext, nextDisabled,
  saveStatus, savedAt,
}: WizardShellProps) {
  const isLast = activeIndex === steps.length - 1;
  const currentStep = steps[activeIndex];

  return (
    <div className="flex flex-col h-full">
      <div className="flex flex-1 overflow-hidden">
        {/* 좌측 세로 stepper (컴팩트 200px) */}
        <aside className="w-[200px] shrink-0 border-r border-[var(--color-border)] p-3 bg-[var(--color-bg-secondary,#fafbfb)]">
          <StepProgress steps={steps} activeIndex={activeIndex} onStepClick={onStepChange} />
        </aside>

        {/* 우측 form 컬럼 */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-[760px] mx-auto px-6 py-5">
            {/*
              통합 body header — 두 그룹으로 분리:
              · 좌측: breadcrumb + step 제목 + 제목 우측 보조 액션 (임시저장·보관함)
              · 우측: 저장상태 + step navigation (이전·다음·공개)
              의도: 파괴/이탈 관련 액션(임시저장)을 네비게이션(이전/다음)과
                   시각적으로 떨어뜨려 혼동·오클릭 감소.
            */}
            <div className="flex items-end justify-between gap-4 mb-5 pb-4 border-b border-[var(--color-border)]">
              <div className="flex items-end gap-3 min-w-0">
                <div className="min-w-0">
                  {title && (
                    <p className="text-[11px] font-medium text-[var(--color-text-dim)] mb-0.5">
                      {title}
                    </p>
                  )}
                  <h1 className="text-[18px] font-bold text-[var(--color-text)] leading-tight">
                    {currentStep?.label}
                  </h1>
                </div>
                {actions && (
                  <div className="flex items-center gap-2 pb-0.5">
                    {actions}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <SaveIndicator status={saveStatus} savedAt={savedAt} />
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

            {/* Step content — activeIndex 변경 시 fade-in */}
            <div key={activeIndex} className="wizard-step-in">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

function SaveIndicator({ status, savedAt }: { status?: 'idle' | 'saving' | 'saved' | 'error'; savedAt?: number | null }) {
  if (!status || status === 'idle') return null;
  if (status === 'saving') {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] text-[var(--color-text-dim)]">
        <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-text-dim)] animate-pulse" />
        저장 중…
      </span>
    );
  }
  if (status === 'error') {
    return (
      <span className="text-[11px] text-[var(--color-danger)]">저장 실패</span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-[11px] text-[var(--color-success,#16a34a)]">
      <Check size={11} />
      저장됨 {savedAt ? `· ${formatSavedAgo(savedAt)}` : ''}
    </span>
  );
}

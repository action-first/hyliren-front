'use client';

import { useConcernFlowStore } from '@/store/concern-flow';
import { StepNarrative } from './StepNarrative';
import { StepAIProcessing } from './StepAIProcessing';
import { StepAIReview } from './StepAIReview';
import { StepFeedback } from './StepFeedback';
import { StepConfirm } from './StepConfirm';

const STEP_LABELS: Record<string, string> = {
  narrative: '고민 입력',
  processing: '분석 중',
  review: 'AI 리뷰',
  feedback: '추가 상담',
  confirm: '최종 확인',
  submitted: '완료',
};

export function ConcernFlow() {
  const { step, analysisCount } = useConcernFlowStore();

  // Progress calculation
  const progressMap: Record<string, number> = {
    narrative: 0.15,
    processing: 0.35,
    review: 0.6,
    feedback: 0.5,
    confirm: 0.85,
    submitted: 1,
  };
  const progress = progressMap[step] || 0;

  // Don't show progress on processing/submitted
  const showProgress = step !== 'processing' && step !== 'submitted';

  return (
    <div className="flex flex-col min-h-[calc(100dvh-2.75rem-var(--fo-bottom-bar-height)-var(--fo-safe-area-bottom)-8px)]">

      {/* Progress bar */}
      {showProgress && (
        <div className="px-5 pt-3 pb-1">
          <div className="h-1 rounded-full bg-[var(--color-bg-tertiary)] overflow-hidden">
            <div
              className="h-full rounded-full bg-[var(--color-primary)] transition-all duration-500"
              style={{ width: `${progress * 100}%` }}
            />
          </div>
          <div className="flex items-center justify-between mt-1.5">
            <span className="text-[10px] font-medium text-[var(--color-primary)]">
              {STEP_LABELS[step]}
            </span>
            {analysisCount > 1 && (
              <span className="text-[10px] text-[var(--color-text-dim)]">
                {analysisCount}차 분석
              </span>
            )}
          </div>
        </div>
      )}

      {/* Step content */}
      <div className="flex-1 px-5 pt-4 pb-4 flex flex-col">
        {step === 'narrative' && <StepNarrative />}
        {step === 'processing' && <StepAIProcessing />}
        {step === 'review' && <StepAIReview />}
        {step === 'feedback' && <StepFeedback />}
        {step === 'confirm' && <StepConfirm />}
        {step === 'submitted' && <StepConfirm />}
      </div>
    </div>
  );
}

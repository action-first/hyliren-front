'use client';

import { useState, useEffect } from 'react';
import { useConcernFlowStore } from '@/store/concern-flow';
import { useAuthStore } from '@/store/auth';
import { useLocaleStore } from '@/store/locale';
import { AuthModal } from '@/components/auth/AuthModal';
import { StepNarrative } from './StepNarrative';
import { StepAIProcessing } from './StepAIProcessing';
import { StepAIReview } from './StepAIReview';
import { StepFeedback } from './StepFeedback';
import { StepConfirm } from './StepConfirm';

export function ConcernFlow() {
  const t = useLocaleStore(s => s.t);
  const { step, analysisCount, photos, setStep } = useConcernFlowStore();
  const { isLoggedIn } = useAuthStore();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [pendingStep, setPendingStep] = useState<string | null>(null);

  // Auth gate: narrative → processing 전환 시 guest + 사진 있으면 로그인 유도
  useEffect(() => {
    if (step === 'processing' && !isLoggedIn && photos.length > 0 && !pendingStep) {
      // processing으로 왔지만 로그인 안됨 → auth modal 먼저
      setPendingStep('processing');
      setStep('narrative'); // 되돌리기
      setShowAuthModal(true);
    }
  }, [step, isLoggedIn, photos.length, pendingStep, setStep]);

  function handleAuthSuccess() {
    setShowAuthModal(false);
    if (pendingStep) {
      setStep(pendingStep as 'processing');
      setPendingStep(null);
    }
  }

  function handleAuthSkip() {
    setShowAuthModal(false);
    // 스킵해도 진행 허용 (guest 상태로 processing)
    if (pendingStep) {
      setStep(pendingStep as 'processing');
      setPendingStep(null);
    }
  }

  const STEP_LABELS: Record<string, string> = {
    narrative: t('consult.stepNarrative'),
    processing: t('consult.stepProcessing'),
    review: t('consult.stepReview'),
    feedback: t('consult.stepFeedback'),
    confirm: t('consult.stepConfirm'),
    submitted: t('consult.stepComplete'),
  };

  const progressMap: Record<string, number> = {
    narrative: 0.15,
    processing: 0.35,
    review: 0.6,
    feedback: 0.7,
    confirm: 0.85,
    submitted: 1,
  };
  const progress = progressMap[step] || 0;
  const showProgress = step !== 'processing' && step !== 'submitted';

  return (
    <>
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
                  {t('consult.analysisCount', { count: analysisCount })}
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

      {/* Auth Modal — 상담 흐름 중 자연스럽게 등장 */}
      <AuthModal
        open={showAuthModal}
        onSuccess={handleAuthSuccess}
        onClose={handleAuthSkip}
      />
    </>
  );
}

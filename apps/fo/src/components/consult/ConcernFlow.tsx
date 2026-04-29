'use client';

import { useState, useEffect } from 'react';
import { useConcernFlowStore } from '@/store/concern-flow';
import { useAuthStore } from '@/store/auth';
import { useLocaleStore } from '@/store/locale';
import { AuthModal } from '@/components/auth/AuthModal';
import { StepNarrative } from './StepNarrative';
import { StepBudget } from './StepBudget';
import { StepVisitPlan } from './StepVisitPlan';
import { StepAIProcessing } from './StepAIProcessing';
import { StepAIReview } from './StepAIReview';
import { StepFeedback } from './StepFeedback';
import { StepConfirm } from './StepConfirm';

type PendingAction = 'processing' | 'confirm_submit' | null;

export function ConcernFlow() {
  const t = useLocaleStore(s => s.t);
  const { step, analysisCount, setStep, resetFlow } = useConcernFlowStore();
  const { isLoggedIn } = useAuthStore();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const [retrySubmitSignal, setRetrySubmitSignal] = useState(0);

  // 이전 상담이 완료(submitted)된 상태에서 재진입 시 초기화
  useEffect(() => {
    if (step === 'submitted') resetFlow();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Auth gate: processing 진입 시 guest 면 로그인 유도.
  // (이전엔 photos.length > 0 조건만 체크했으나, 사진 없는 guest 도 submit 까지 갔다가
  //  401 이 나는 퍼널 누수가 있어 모든 guest 에게 적용)
  useEffect(() => {
    if (step === 'processing' && !isLoggedIn && !pendingAction) {
      setPendingAction('processing');
      setShowAuthModal(true);
    }
  }, [step, isLoggedIn, pendingAction]);

  // StepConfirm 이 submit 중 401 을 받으면 이 콜백을 호출한다 — 2중 방어망.
  function requestAuthForSubmit() {
    setPendingAction('confirm_submit');
    setShowAuthModal(true);
  }

  function handleAuthSuccess() {
    const action = pendingAction;
    setShowAuthModal(false);
    setPendingAction(null);

    if (action === 'processing') {
      setStep('processing');
    } else if (action === 'confirm_submit') {
      // StepConfirm 이 effect 로 이 카운터를 watch 하여 handleConfirm 을 재실행한다
      setRetrySubmitSignal(s => s + 1);
    }
  }

  function handleAuthSkip() {
    const action = pendingAction;
    setShowAuthModal(false);
    setPendingAction(null);

    // 스킵해도 진행 허용 (guest 로 processing 진행). 단 confirm_submit 은 재시도 없음 —
    // 사용자가 직접 submit 버튼을 다시 눌러야 한다.
    if (action === 'processing') {
      setStep('processing');
    }
  }

  const STEP_LABELS: Record<string, string> = {
    narrative: t('consult.stepNarrative'),
    budget: t('consult.budgetLabel'),
    'visit-plan': t('consult.visitPlanLabel'),
    processing: t('consult.stepProcessing'),
    review: t('consult.stepReview'),
    feedback: t('consult.stepFeedback'),
    confirm: t('consult.stepConfirm'),
    submitted: t('consult.stepComplete'),
  };

  const progressMap: Record<string, number> = {
    narrative: 0.15,
    budget: 0.35,
    'visit-plan': 0.5,
    processing: 0.55,
    review: 0.7,
    feedback: 0.8,
    confirm: 0.9,
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
          {step === 'budget' && <StepBudget />}
          {step === 'visit-plan' && <StepVisitPlan />}
          {step === 'processing' && <StepAIProcessing />}
          {step === 'review' && <StepAIReview />}
          {step === 'feedback' && <StepFeedback />}
          {step === 'confirm' && (
            <StepConfirm
              onAuthRequired={requestAuthForSubmit}
              retrySubmitSignal={retrySubmitSignal}
            />
          )}
          {step === 'submitted' && (
            <StepConfirm
              onAuthRequired={requestAuthForSubmit}
              retrySubmitSignal={retrySubmitSignal}
            />
          )}
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

'use client';

import { useEffect, useRef, useState } from 'react';
import { useLocalizedRouter } from '@/hooks/use-localized-router';
import { Button } from '@hyliren/ui';
import { ArrowRight, Edit3, Sparkles, Clock, Loader2 } from 'lucide-react';
import { useConcernFlowStore, BUDGET_LABEL_KEYS, VISIT_TIMING_LABEL_KEYS, STAY_DURATION_LABEL_KEYS } from '@/store/concern-flow';
import type { BudgetRange, VisitTiming } from '@/store/concern-flow';
import { useLocaleStore } from '@/store/locale';
import { AIAnalysisResultCard } from './ConcernSummaryCard';
import { track } from '@hyliren/shared';
import { createConcern, submitConcern, updateConcern } from '@/lib/api/concern';
import { ApiError } from '@/lib/api/errors';

function buildBudget(range: BudgetRange | null): { budgetMin?: number; budgetMax?: number } {
  switch (range) {
    case 'under100':  return { budgetMin: 0,   budgetMax: 100 };
    case '100to300':  return { budgetMin: 100,  budgetMax: 300 };
    case '300to500':  return { budgetMin: 300,  budgetMax: 500 };
    case 'over500':   return { budgetMin: 500 };
    default:          return {};
  }
}

function buildVisitDates(timing: VisitTiming | null): { visitDateFrom?: string; visitDateTo?: string } {
  if (!timing || timing === 'undecided') { return {}; }
  const from = new Date();
  const to = new Date();
  switch (timing) {
    case 'within1m': to.setMonth(to.getMonth() + 1); break;
    case 'within3m': to.setMonth(to.getMonth() + 3); break;
    case 'within6m': to.setMonth(to.getMonth() + 6); break;
  }
  return {
    visitDateFrom: from.toISOString().slice(0, 10),
    visitDateTo: to.toISOString().slice(0, 10),
  };
}

interface Props {
  /**
   * submit 중 401 발생 시 부모 (ConcernFlow) 에게 auth modal 요청.
   * 로그인 성공 이후 부모가 retrySubmitSignal 을 증가시키면 자동 재시도.
   */
  onAuthRequired?: () => void;
  /** 부모가 auth 성공 시 이 값을 bump 하면 handleConfirm 이 재실행된다. */
  retrySubmitSignal?: number;
}

export function StepConfirm({ onAuthRequired, retrySubmitSignal = 0 }: Props = {}) {
  const t = useLocaleStore(s => s.t);
  const router = useLocalizedRouter();
  const {
    analysisResult, photos, narrativeInput, analysisCount,
    selectedBodyArea, budgetRange, visitTiming, stayDuration,
    bodyAreaDetail, currentConcernId, feedbackTurns,
    setStep, setCurrentConcernId, resetFlow,
  } = useConcernFlowStore();
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  // 최신 handleConfirm 을 capture 해서 retry effect 에서 호출 (closure 고정 문제 회피)
  const handleConfirmRef = useRef<() => Promise<void>>(() => Promise.resolve());

  async function handleConfirm() {
    if (submitting) { return; }
    setSubmitting(true);
    setApiError(null);

    track({
      eventType: 'concern_submit_started', actorType: 'user', metadata: {
        source: 'fo',
        label: analysisResult!.extractedSummary.primaryArea || '',
        value: String(analysisCount),
      },
    });

    try {
      // ─── 1. concernId 확보 ──────────────────────────────────────────────
      // 정상 흐름: StepAIProcessing 에서 createConcern 으로 이미 DRAFT 생성됨.
      // Fallback: backend 호출 실패로 currentConcernId 가 null 이면 여기서 생성.
      let concernId = currentConcernId;
      if (!concernId) {
        const areas = analysisResult!.extractedSummary.bodyAreas?.length
          ? analysisResult!.extractedSummary.bodyAreas
          : selectedBodyArea ? [selectedBodyArea] : [];
        const created = await createConcern({
          description: narrativeInput,
          areas,
          detail: analysisResult!.extractedSummary.bodyAreaDetail || bodyAreaDetail || undefined,
          photos,
          source: 'organic',
          ...buildBudget(budgetRange),
          ...buildVisitDates(visitTiming),
        });
        concernId = created.id;
        setCurrentConcernId(concernId);
      } else {
        // 이미 생성된 DRAFT 의 budget/visitDate 가 사용자 입력 후 변경되었을 수
        // 있으므로 마지막에 갱신. backend UpdateConcernRequestDto 가 받는 필드만.
        const update: Parameters<typeof updateConcern>[1] = {
          ...buildBudget(budgetRange),
          ...buildVisitDates(visitTiming),
        };
        if (Object.keys(update).length > 0) {
          await updateConcern(concernId, update).catch(() => { /* silent — 핵심 흐름 차단 안 함 */ });
        }
      }

      // ─── 2. 제출 ────────────────────────────────────────────────────────
      await submitConcern(concernId);
    } catch (err) {
      if (err instanceof ApiError && err.isUnauthorized()) {
        track({
          eventType: 'concern_submit_blocked_unauth', actorType: 'user',
          metadata: { source: 'fo' },
        });
        setSubmitting(false);
        onAuthRequired?.();
        return;
      }
      // BE envelope.error 가 stable ERR_* code 면 i18n 매핑 우선.
      let msg: string;
      if (err instanceof ApiError && err.code?.startsWith('ERR_')) {
        const key = `error.${err.code}`;
        const translated = t(key);
        msg = translated !== key
          ? translated
          : (err.isServerError() ? t('consult.submitErrorServer') : t('consult.submitErrorRetry'));
      } else {
        msg = err instanceof ApiError && err.isServerError()
          ? t('consult.submitErrorServer')
          : t('consult.submitErrorRetry');
      }
      setApiError(msg);
      setSubmitting(false);
      return;
    }

    track({
      eventType: 'concern_submit_completed', actorType: 'user', metadata: {
        source: 'fo',
        label: analysisResult!.extractedSummary.primaryArea || '',
        value: String(analysisCount),
      },
    });

    setSubmitting(false);
    setDone(true);
    setTimeout(() => { resetFlow(); router.push('/dashboard'); }, 2500);
  }

  // 최신 closure 를 ref 에 저장
  handleConfirmRef.current = handleConfirm;

  // 부모 (ConcernFlow) 가 auth 성공 후 retrySubmitSignal 을 증가시키면 재시도.
  // 초기값 0 일 때는 effect 발동하되 guard 로 무시.
  useEffect(() => {
    if (retrySubmitSignal > 0) {
      handleConfirmRef.current();
    }
  }, [retrySubmitSignal]);

  if (!analysisResult) { return null; }

  if (done) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-5">
        <div className="w-16 h-16 rounded-full bg-[var(--color-success-soft)] flex items-center justify-center mb-5">
          <Sparkles size={28} className="text-[var(--color-success)]" />
        </div>
        <h2 className="text-[1.25rem] font-bold text-[var(--color-text)] mb-2">{t('consult.completeTitle')}</h2>
        <p className="text-[13px] text-[var(--color-text-dim)] text-center leading-relaxed mb-4">
          {t('consult.completeDesc')}
        </p>
        <div className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-[var(--color-bg-secondary)]">
          <Clock size={14} className="text-[var(--color-text-dim)]" />
          <span className="text-[12px] text-[var(--color-text-secondary)]">{t('consult.completeDelivery')}</span>
        </div>
      </div>
    );
  }

  if (submitting) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-5">
        <div className="w-16 h-16 rounded-full bg-[var(--color-primary-soft)] flex items-center justify-center mb-5">
          <Loader2 size={28} className="text-[var(--color-primary)] animate-spin" />
        </div>
        <h2 className="text-[1.125rem] font-bold text-[var(--color-text)] mb-1.5">{t('consult.confirmSubmitting')}</h2>
        <p className="text-[13px] text-[var(--color-text-dim)]">{t('consult.confirmSubmittingDesc')}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-full">
      <div className="mb-5">
        <h1 className="text-[1.375rem] font-extrabold text-[var(--color-text)] leading-tight tracking-[-0.3px] mb-1.5">
          {t('consult.confirmTitle')}
        </h1>
        <p className="text-[12px] text-[var(--color-text-dim)]">{t('consult.confirmDesc')}</p>
      </div>

      {photos.length > 0 && (
        <div className="flex gap-2 mb-4">
          {photos.map((p, i) => (
            <div key={i} className="w-16 h-20 rounded-[var(--app-radius)] overflow-hidden">
              <img src={p} alt="" className="w-full h-full object-cover" />
            </div>
          ))}
        </div>
      )}

      <div className="rounded-[var(--app-radius-md)] bg-[var(--color-bg-secondary)] px-4 py-3 mb-3">
        <span className="text-[10px] text-[var(--color-text-dim)] block mb-1">{t('consult.confirmYourConcern')}</span>
        <p className="text-[13px] text-[var(--color-text)] leading-relaxed">{narrativeInput}</p>
      </div>

      <div className="flex flex-wrap gap-2 mb-3">
        {selectedBodyArea && (
          <span className="px-2.5 py-1 rounded-[var(--app-radius-sm)] bg-[var(--color-info-soft)] text-[11px] font-medium text-[var(--color-info)]">
            {t(`common.bodyArea.${selectedBodyArea}`)}
          </span>
        )}
        {budgetRange && (
          <span className="px-2.5 py-1 rounded-[var(--app-radius-sm)] bg-[var(--color-bg-secondary)] text-[11px] font-medium text-[var(--color-text-secondary)]">
            {t(BUDGET_LABEL_KEYS[budgetRange])}
          </span>
        )}
        {visitTiming && (
          <span className="px-2.5 py-1 rounded-[var(--app-radius-sm)] bg-[var(--color-bg-secondary)] text-[11px] font-medium text-[var(--color-text-secondary)]">
            {t(VISIT_TIMING_LABEL_KEYS[visitTiming])}
          </span>
        )}
        {stayDuration && (
          <span className="px-2.5 py-1 rounded-[var(--app-radius-sm)] bg-[var(--color-bg-secondary)] text-[11px] font-medium text-[var(--color-text-secondary)]">
            {t(STAY_DURATION_LABEL_KEYS[stayDuration])}
          </span>
        )}
      </div>

      {feedbackTurns.length > 0 && (
        <div className="rounded-[var(--app-radius-md)] bg-[var(--color-bg-secondary)] px-4 py-3 mb-3">
          <span className="text-[10px] text-[var(--color-text-dim)] block mb-1.5">
            {t('consult.confirmAdditional')} ({feedbackTurns.filter(ft => ft.role === 'user').length}{t('common.times')})
          </span>
          {feedbackTurns.filter(ft => ft.role === 'user').map((ft, i) => (
            <p key={i} className="text-[12px] text-[var(--color-text-secondary)] leading-relaxed mb-1">· {ft.message}</p>
          ))}
        </div>
      )}

      <div className="mb-6">
        <AIAnalysisResultCard result={analysisResult} compact />
      </div>

      {apiError && (
        <div className="mb-3 px-4 py-3 rounded-[var(--app-radius)] bg-[var(--color-danger-soft)] text-[12px] text-[var(--color-danger)]">
          {apiError}
        </div>
      )}

      <div className="mt-auto flex flex-col gap-2 pb-2">
        <Button variant="primary" size="xl" fullWidth onClick={handleConfirm}>
          {t('consult.confirmCta')}
          <ArrowRight size={18} />
        </Button>
        <button
          onClick={() => setStep('feedback')}
          className="flex items-center justify-center gap-1.5 w-full py-2 rounded-[var(--app-radius)] bg-transparent border-0 cursor-pointer text-[12px] text-[var(--color-text-dim)]">
          <Edit3 size={12} />
          {t('consult.confirmExplainMore')}
        </button>
      </div>
    </div>
  );
}

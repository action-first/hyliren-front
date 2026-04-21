'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@hyliren/ui';
import { ArrowRight, Edit3, Sparkles, Clock, Loader2 } from 'lucide-react';
import { useConcernFlowStore, BUDGET_LABELS, VISIT_TIMING_LABELS, STAY_DURATION_LABELS } from '@/store/concern-flow';
import type { BudgetRange, VisitTiming } from '@/store/concern-flow';
import { useLocaleStore } from '@/store/locale';
import { AIAnalysisResultCard } from './ConcernSummaryCard';
import { track } from '@hyliren/shared';
import { createConcern, submitConcern } from '@/lib/api/concern';
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

export function StepConfirm() {
  const t = useLocaleStore(s => s.t);
  const router = useRouter();
  const {
    analysisResult, photos, narrativeInput, feedbackTurns, analysisCount,
    selectedBodyArea, budgetRange, visitTiming, stayDuration,
    bodyAreaDetail,
    setStep, resetFlow,
  } = useConcernFlowStore();
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  if (!analysisResult) { return null; }

  async function handleConfirm() {
    if (submitting) { return; }
    setSubmitting(true);
    setApiError(null);

    track({
      eventType: 'concern_submitted', actorType: 'user', metadata: {
        source: 'fo', locale: 'ko',
        label: analysisResult!.extractedSummary.primaryArea || '',
        value: String(analysisCount),
      },
    });

    const areas = analysisResult!.extractedSummary.bodyAreas?.length
      ? analysisResult!.extractedSummary.bodyAreas
      : selectedBodyArea ? [selectedBodyArea] : [];

    const body = {
      description: narrativeInput,
      areas,
      detail: analysisResult!.extractedSummary.bodyAreaDetail || bodyAreaDetail || undefined,
      photos,
      source: 'organic' as const,
      ...buildBudget(budgetRange),
      ...buildVisitDates(visitTiming),
    };

    try {
      const { id } = await createConcern(body);
      await submitConcern(id);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.';
      setApiError(msg);
      setSubmitting(false);
      return;
    }

    setSubmitting(false);
    setDone(true);
    setTimeout(() => { resetFlow(); router.push('/dashboard'); }, 2500);
  }

  if (done) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-5">
        <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mb-5">
          <Sparkles size={28} className="text-emerald-500" />
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
            <div key={i} className="w-16 h-20 rounded-xl overflow-hidden">
              <img src={p} alt="" className="w-full h-full object-cover" />
            </div>
          ))}
        </div>
      )}

      <div className="rounded-2xl bg-[var(--color-bg-secondary)] px-4 py-3 mb-3">
        <span className="text-[10px] text-[var(--color-text-dim)] block mb-1">{t('consult.confirmYourConcern')}</span>
        <p className="text-[13px] text-[var(--color-text)] leading-relaxed">{narrativeInput}</p>
      </div>

      <div className="flex flex-wrap gap-2 mb-3">
        {selectedBodyArea && (
          <span className="px-2.5 py-1 rounded-lg bg-blue-50 text-[11px] font-medium text-blue-600">
            {selectedBodyArea}
          </span>
        )}
        {budgetRange && (
          <span className="px-2.5 py-1 rounded-lg bg-[var(--color-bg-secondary)] text-[11px] font-medium text-[var(--color-text-secondary)]">
            {BUDGET_LABELS[budgetRange]}
          </span>
        )}
        {visitTiming && (
          <span className="px-2.5 py-1 rounded-lg bg-[var(--color-bg-secondary)] text-[11px] font-medium text-[var(--color-text-secondary)]">
            {VISIT_TIMING_LABELS[visitTiming]}
          </span>
        )}
        {stayDuration && (
          <span className="px-2.5 py-1 rounded-lg bg-[var(--color-bg-secondary)] text-[11px] font-medium text-[var(--color-text-secondary)]">
            체류 {STAY_DURATION_LABELS[stayDuration]}
          </span>
        )}
      </div>

      {feedbackTurns.length > 0 && (
        <div className="rounded-2xl bg-[var(--color-bg-secondary)] px-4 py-3 mb-3">
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
        <div className="mb-3 px-4 py-3 rounded-xl bg-red-50 text-[12px] text-red-600">
          {apiError}
        </div>
      )}

      <div className="mt-auto flex flex-col gap-2 pb-2">
        <Button variant="accent" size="xl" fullWidth onClick={handleConfirm}>
          {t('consult.confirmCta')}
          <ArrowRight size={18} />
        </Button>
        <button
          onClick={() => setStep('feedback')}
          className="flex items-center justify-center gap-1.5 w-full py-2 rounded-xl bg-transparent border-0 cursor-pointer text-[12px] text-[var(--color-text-dim)]">
          <Edit3 size={12} />
          {t('consult.confirmExplainMore')}
        </button>
      </div>
    </div>
  );
}

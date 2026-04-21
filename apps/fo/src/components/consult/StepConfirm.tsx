'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@hyliren/ui';
import { ArrowRight, Edit3, Sparkles, Clock, Loader2, Shield } from 'lucide-react';
import { useConcernFlowStore, BUDGET_LABELS, VISIT_TIMING_LABELS, STAY_DURATION_LABELS } from '@/store/concern-flow';
import { useUserConcernsStore } from '@/store/user-concerns';
import { useLocaleStore } from '@/store/locale';
import { AIAnalysisResultCard } from './ConcernSummaryCard';
import { track } from '@hyliren/shared';

export function StepConfirm() {
  const t = useLocaleStore(s => s.t);
  const router = useRouter();
  const {
    analysisResult, photos, narrativeInput, feedbackTurns, analysisCount,
    selectedBodyArea, budgetRange, visitTiming, stayDuration,
    setStep, resetFlow,
  } = useConcernFlowStore();
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  if (!analysisResult) return null;

  async function handleConfirm() {
    if (submitting) return;
    setSubmitting(true);
    track({ eventType: 'concern_submitted', actorType: 'user', metadata: {
      source: 'fo', locale: 'ko',
      label: analysisResult!.extractedSummary.primaryArea || '',
      value: String(analysisCount),
    }});
    await new Promise(r => setTimeout(r, 2000));

    // 로컬 스토어 + 공유 API 저장
    const concern = useUserConcernsStore.getState().addFromAnalysis(analysisResult!, narrativeInput, photos);
    try {
      await fetch('/api/concerns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(concern),
      });
    } catch (e) {
      console.error('[StepConfirm] API 저장 실패, 로컬에만 저장됨:', e);
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

      {/* 구조화 데이터 */}
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

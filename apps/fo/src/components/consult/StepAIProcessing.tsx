'use client';

import { useEffect, useState } from 'react';
import { useConcernFlowStore, type BudgetRange, type VisitTiming } from '@/store/concern-flow';
import { useLocaleStore } from '@/store/locale';
import { useToastStore } from '@/store/toast';
import type { AnalysisResponse } from '@/server/concern-analysis/types';
import { createConcern, requestAIAnalysis } from '@/lib/api/concern';
import { ApiError } from '@/lib/api/errors';

function buildBudget(range: BudgetRange | null): { budgetMin?: number; budgetMax?: number } {
  switch (range) {
    case 'under100':  return { budgetMin: 0,   budgetMax: 100 };
    case '100to300':  return { budgetMin: 100, budgetMax: 300 };
    case '300to500':  return { budgetMin: 300, budgetMax: 500 };
    case 'over500':   return { budgetMin: 500 };
    default:          return {};
  }
}

function buildVisitDates(timing: VisitTiming | null): { visitDateFrom?: string; visitDateTo?: string } {
  if (!timing || timing === 'undecided') return {};
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

export function StepAIProcessing() {
  const t = useLocaleStore(s => s.t);

  const COPY_SEQUENCE = [
    t('consult.processingCopy1'),
    t('consult.processingCopy2'),
    t('consult.processingCopy3'),
  ];
  const {
    narrativeInput, photos, feedbackTurns, analysisCount,
    selectedBodyArea, bodyAreaDetail, budgetRange, visitTiming,
    currentConcernId, setCurrentConcernId,
    setAnalysisResult, setStep, incrementAnalysis,
  } = useConcernFlowStore();
  const { showToast } = useToastStore();

  const [copyIdx, setCopyIdx] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCopyIdx(prev => (prev + 1) % COPY_SEQUENCE.length);
    }, 1200);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      // ─── 1. FE 자체 mock AI 분석 ─────────────────────────────────────────
      // 백로그: backend 의 requestAIAnalysis / submitAIAnalysisFeedback 가 LLM
      // 미통합 placeholder 라 client 가 자체 mock 결과를 만들어 review/feedback
      // 단계에서 사용. backend LLM 통합 후 getAIAnalysis 결과로 교체 예정.
      let analysis: AnalysisResponse | null = null;
      try {
        const res = await fetch('/api/concern-analysis', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            photos,
            narrative: narrativeInput,
            feedbackTurns: feedbackTurns.length > 0 ? feedbackTurns : undefined,
          }),
        });

        if (cancelled) return;

        // 입력 품질 부족(400) — 무작정 fallback하지 말고 narrative로 복귀
        if (res.status === 400) {
          showToast(t('consult.narrativeTooShortToast'), 'error');
          setStep('narrative');
          return;
        }

        if (!res.ok) throw new Error(`API error: ${res.status}`);
        analysis = await res.json();
      } catch {
        if (cancelled) return;
        // 서버 장애·네트워크 오류만 fallback — 사용자 입력 탓은 아니므로 진행 허용
        showToast(t('consult.processingFallback'), 'error');
        analysis = {
          empathy: '고민을 나눠주셔서 감사합니다.',
          education: '한국은 다양한 미용 시술에서 세계적인 수준을 갖추고 있습니다.',
          options: [{ key: 'generic', name: '맞춤 상담', description: '병원과 함께 최적의 방법을 찾아보세요.', bodyArea: '기타' }],
          extractedTags: { symptoms: [], preferences: [], budget: [], timing: [] },
          extractedSummary: { bodyAreas: ['기타'], primaryArea: '기타', bodyAreaDetail: '일반 상담' },
          disclaimer: '정확한 진단은 실제 병원 상담을 통해 결정됩니다.',
          ruleVersion: 'fallback',
        };
      }

      if (!analysis || cancelled) return;
      setAnalysisResult(analysis);
      incrementAnalysis();

      // ─── 2. 첫 진입(analysisCount===0)에만 backend DRAFT 생성 ───────────
      // 재진입(feedback 후) 에는 이미 currentConcernId 가 있으므로 skip.
      // backend 호출 실패해도 UX 차단하지 않음 — StepConfirm 의 fallback 으로 재시도.
      if (analysisCount === 0 && !currentConcernId) {
        try {
          const areas = analysis.extractedSummary.bodyAreas?.length
            ? analysis.extractedSummary.bodyAreas
            : selectedBodyArea ? [selectedBodyArea] : [];
          const { id } = await createConcern({
            description: narrativeInput,
            areas,
            detail: analysis.extractedSummary.bodyAreaDetail || bodyAreaDetail || undefined,
            photos,
            source: 'organic',
            ...buildBudget(budgetRange),
            ...buildVisitDates(visitTiming),
          });
          if (cancelled) return;
          setCurrentConcernId(id);
          // AI 분석 트리거 (backend placeholder — fire-and-forget)
          await requestAIAnalysis(id).catch(() => { /* placeholder 라 실패해도 무시 */ });
        } catch (err) {
          // 401 은 client.ts 가 refresh 하지만 실패 시 ApiError 로 throw — 여기서는 silent.
          // StepConfirm 에서 다시 시도하므로 흐름은 review 로 진행.
          if (err instanceof ApiError && err.isUnauthorized()) {
            // 인증 실패 — 그대로 흐름 진행, StepConfirm 에서 onAuthRequired 트리거
          }
          // 그 외 에러도 client state 로만 보관하고 review 진행
        }
      }

      if (!cancelled) setStep('review');
    })();

    return () => { cancelled = true; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-5">
      <div className="relative w-20 h-20 mb-8">
        <div className="absolute inset-0 rounded-full fo-gradient-accent-br animate-pulse" />
        <div className="absolute inset-2 rounded-full bg-[var(--color-bg)] flex items-center justify-center">
          <div className="w-6 h-6 rounded-full border-2 border-[var(--color-primary)] border-t-transparent animate-spin" />
        </div>
      </div>

      <p className="text-[15px] font-medium text-[var(--color-text)] text-center mb-2 transition-opacity duration-300">
        {COPY_SEQUENCE[copyIdx]}
      </p>
      <p className="text-[12px] text-[var(--color-text-dim)] text-center">
        {analysisCount > 0 ? t('consult.processingReanalysis') : t('consult.processingWait')}
      </p>

      <div className="flex gap-1.5 mt-6">
        {[0, 1, 2].map(i => (
          <div key={i} className={`w-2 h-2 rounded-full transition-colors duration-300 ${
            i <= copyIdx ? 'bg-[var(--color-primary)]' : 'bg-[var(--color-border-light)]'
          }`} />
        ))}
      </div>
    </div>
  );
}

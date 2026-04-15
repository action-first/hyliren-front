'use client';

import { useEffect, useState } from 'react';
import { useConcernFlowStore } from '@/store/concern-flow';
import { useLocaleStore } from '@/store/locale';
import type { AnalysisResponse } from '@/server/concern-analysis/types';

export function StepAIProcessing() {
  const t = useLocaleStore(s => s.t);

  const COPY_SEQUENCE = [
    t('consult.processingCopy1'),
    t('consult.processingCopy2'),
    t('consult.processingCopy3'),
  ];
  const {
    narrativeInput, photos, feedbackTurns, analysisCount,
    setAnalysisResult, setStep, incrementAnalysis,
  } = useConcernFlowStore();

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
        if (!res.ok) throw new Error(`API error: ${res.status}`);

        const data: AnalysisResponse = await res.json();
        setAnalysisResult(data);
        incrementAnalysis();
        setStep('review');
      } catch {
        // TODO: feedback 시 extract skip 최적화
        // API route has internal fallback, this catch is for network errors
        if (!cancelled) setStep('review');
      }
    })();

    return () => { cancelled = true; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-5">
      <div className="relative w-20 h-20 mb-8">
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[var(--color-primary-soft)] to-[#fff5f7] animate-pulse" />
        <div className="absolute inset-2 rounded-full bg-white flex items-center justify-center">
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

'use client';

import { useEffect, useState } from 'react';
import { useConcernFlowStore } from '@/store/concern-flow';
import type { AnalysisResponse } from '@/modules/concern-analysis/types';

const COPY_SEQUENCE = [
  '고객님의 사진과 이야기를 분석하고 있어요',
  '원하시는 변화와 예산, 방문 시기를 함께 정리하고 있습니다',
  '자연스러운 방향으로 어떤 옵션이 가능한지 살펴보고 있어요',
];

export function StepAIProcessing() {
  const {
    narrativeInput, photos, feedbackTurns, analysisCount,
    setAnalysisResult, setStep, incrementAnalysis,
  } = useConcernFlowStore();

  const [copyIdx, setCopyIdx] = useState(0);
  const isReanalysis = analysisCount > 0;

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
        {isReanalysis ? '피드백을 반영해 다시 정리하고 있어요' : '잠시만 기다려주세요'}
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

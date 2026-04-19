'use client';

import { useEffect, useState } from 'react';
import { useConcernFlowStore } from '@/store/concern-flow';
import { useLocaleStore } from '@/store/locale';
import { useToastStore } from '@/store/toast';
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
        // 네트워크 오류 시 fallback 분석 결과 세팅
        if (!cancelled) {
          showToast('분석 중 연결 오류가 발생했습니다. 기본 안내로 대체합니다.', 'error');
          setAnalysisResult({
            empathy: '고민을 나눠주셔서 감사합니다.',
            education: '한국은 다양한 미용 시술에서 세계적인 수준을 갖추고 있습니다.',
            options: [{ key: 'generic', name: '맞춤 상담', description: '병원과 함께 최적의 방법을 찾아보세요.', bodyArea: '기타' }],
            extractedTags: { symptoms: [], preferences: [], budget: [], timing: [] },
            extractedSummary: { bodyAreas: ['기타'], primaryArea: '기타', bodyAreaDetail: '일반 상담' },
            disclaimer: '정확한 진단은 실제 병원 상담을 통해 결정됩니다.',
            ruleVersion: 'fallback',
          });
          incrementAnalysis();
          setStep('review');
        }
      }
    })();

    return () => { cancelled = true; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-5">
      <div className="relative w-20 h-20 mb-8">
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[var(--color-primary-soft)] to-[var(--color-bg-wash)] animate-pulse" />
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

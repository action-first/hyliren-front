'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@hyliren/ui';
import { ArrowRight, Edit3, Sparkles, Clock, Loader2, Shield } from 'lucide-react';
import { useConcernFlowStore } from '@/store/concern-flow';
import { AIAnalysisResultCard } from './ConcernSummaryCard';
import { track } from '@hyliren/shared';

export function StepConfirm() {
  const router = useRouter();
  const {
    analysisResult, photos, narrativeInput, feedbackTurns, analysisCount,
    setStep, resetFlow,
  } = useConcernFlowStore();
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  if (!analysisResult) return null;

  async function handleConfirm() {
    setSubmitting(true);
    track({ eventType: 'concern_submitted', actorType: 'user', metadata: {
      source: 'fo', locale: 'ko',
      label: analysisResult!.extractedSummary.bodyArea || '',
      value: String(analysisCount),
    }});
    await new Promise(r => setTimeout(r, 2000));
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
        <h2 className="text-[1.25rem] font-bold text-[var(--color-text)] mb-2">상담이 등록되었어요!</h2>
        <p className="text-[13px] text-[var(--color-text-dim)] text-center leading-relaxed mb-4">
          보통 2~5개 병원이 맞춤 제안서를 보내드립니다
        </p>
        <div className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-[var(--color-bg-secondary)]">
          <Clock size={14} className="text-[var(--color-text-dim)]" />
          <span className="text-[12px] text-[var(--color-text-secondary)]">평균 24~48시간 내 도착</span>
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
        <h2 className="text-[1.125rem] font-bold text-[var(--color-text)] mb-1.5">제출 중입니다...</h2>
        <p className="text-[13px] text-[var(--color-text-dim)]">검증된 병원에 전달하고 있어요</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-full">
      <div className="mb-5">
        <h1 className="text-[1.375rem] font-extrabold text-[var(--color-text)] leading-tight tracking-[-0.3px] mb-1.5">
          최종 확인
        </h1>
        <p className="text-[12px] text-[var(--color-text-dim)]">아래 내용으로 병원에 전달됩니다</p>
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
        <span className="text-[10px] text-[var(--color-text-dim)] block mb-1">고객님의 고민</span>
        <p className="text-[13px] text-[var(--color-text)] leading-relaxed">{narrativeInput}</p>
      </div>

      {feedbackTurns.length > 0 && (
        <div className="rounded-2xl bg-[var(--color-bg-secondary)] px-4 py-3 mb-3">
          <span className="text-[10px] text-[var(--color-text-dim)] block mb-1.5">
            추가 요청 ({feedbackTurns.filter(t => t.role === 'user').length}회)
          </span>
          {feedbackTurns.filter(t => t.role === 'user').map((t, i) => (
            <p key={i} className="text-[12px] text-[var(--color-text-secondary)] leading-relaxed mb-1">· {t.message}</p>
          ))}
        </div>
      )}

      <div className="mb-6">
        <AIAnalysisResultCard result={analysisResult} compact />
      </div>

      <div className="mt-auto flex flex-col gap-2 pb-2">
        <Button variant="accent" size="lg" fullWidth onClick={handleConfirm}>
          이 내용으로 제안서 받기
          <ArrowRight size={18} />
        </Button>
        <button
          onClick={() => setStep('feedback')}
          className="flex items-center justify-center gap-1.5 w-full py-2 rounded-xl bg-transparent border-0 cursor-pointer text-[12px] text-[var(--color-text-dim)]">
          <Edit3 size={12} />
          조금 더 설명하기
        </button>
      </div>
    </div>
  );
}

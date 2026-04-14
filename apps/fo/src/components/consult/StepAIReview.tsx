'use client';

import { Button } from '@hyliren/ui';
import { MessageCircle } from 'lucide-react';
import { useConcernFlowStore } from '@/store/concern-flow';
import { AIAnalysisResultCard } from './ConcernSummaryCard';

export function StepAIReview() {
  const { analysisResult, analysisCount, setStep } = useConcernFlowStore();

  if (!analysisResult) return null;

  return (
    <div className="flex flex-col min-h-full">
      <div className="mb-5">
        <h1 className="text-[1.375rem] font-extrabold text-[var(--color-text)] leading-tight tracking-[-0.3px] mb-1.5">
          {analysisCount > 1 ? '다시 정리했어요' : '분석이 완료되었어요'}
        </h1>
        <p className="text-[12px] text-[var(--color-text-dim)]">
          내용을 확인하고, 수정할 부분이 있으면 알려주세요
        </p>
      </div>

      {/* Empathy */}
      <div className="rounded-2xl bg-gradient-to-br from-[#fff5f7] to-white px-4 py-4 mb-3"
        style={{ boxShadow: '0 0 0 1px rgba(0,0,0,0.04)' }}>
        <p className="text-[14px] text-[var(--color-text)] leading-[1.7]">
          {analysisResult.empathy}
        </p>
      </div>

      {/* Education */}
      <div className="rounded-2xl bg-white px-4 py-4 mb-3"
        style={{ boxShadow: '0 0 0 1px rgba(0,0,0,0.04), 0 1px 3px rgba(0,0,0,0.04)' }}>
        <p className="text-[13px] text-[var(--color-text-secondary)] leading-[1.7]">
          {analysisResult.education}
        </p>
      </div>

      {/* Summary Card */}
      <div className="mb-6">
        <AIAnalysisResultCard result={analysisResult} />
      </div>

      {/* CTA */}
      <div className="mt-auto flex flex-col gap-2 pb-2">
        <Button variant="accent" size="lg" fullWidth onClick={() => setStep('confirm')}>
          이 내용으로 제안서 받기
        </Button>
        <button
          onClick={() => setStep('feedback')}
          className="flex items-center justify-center gap-1.5 w-full py-2.5 rounded-xl bg-transparent border-0 cursor-pointer text-[13px] font-medium text-[var(--color-text-secondary)]">
          <MessageCircle size={14} />
          수정할 부분이 있어요
        </button>
      </div>
    </div>
  );
}

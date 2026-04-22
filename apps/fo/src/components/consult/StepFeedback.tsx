'use client';

import { useRef, useEffect } from 'react';
import { Send } from 'lucide-react';
import { useConcernFlowStore } from '@/store/concern-flow';
import { useLocaleStore } from '@/store/locale';
import type { FeedbackTurn } from '@/server/concern-analysis/types';

export function StepFeedback() {
  const t = useLocaleStore(s => s.t);
  const {
    analysisResult, feedbackInput, feedbackTurns,
    setFeedbackInput, addFeedbackTurn, setStep,
  } = useConcernFlowStore();

  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [feedbackTurns.length]);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 120) + 'px';
  }, [feedbackInput]);

  function handleSubmitFeedback() {
    if (!feedbackInput.trim()) return;
    const userTurn: FeedbackTurn = { role: 'user', message: feedbackInput.trim() };
    addFeedbackTurn(userTurn);
    setFeedbackInput('');
    setStep('processing');
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey && feedbackInput.trim()) {
      e.preventDefault();
      handleSubmitFeedback();
    }
  }

  return (
    <div className="flex flex-col min-h-full">
      <div className="mb-4">
        <h1 className="text-[1.375rem] font-extrabold text-[var(--color-text)] leading-tight tracking-[-0.3px] mb-1.5">
          {t('consult.feedbackTitle')}
        </h1>
        <p className="text-[12px] text-[var(--color-text-dim)]">
          {t('consult.feedbackDesc')}
        </p>
      </div>

      <div ref={scrollRef} className="flex-1 flex flex-col gap-3 mb-4 overflow-y-auto max-h-[50vh]">
        {analysisResult && (
          <div className="flex justify-start">
            <div className="max-w-[85%] px-4 py-3 rounded-[20px] rounded-bl-md bg-[var(--color-bg-secondary)] text-[13px] text-[var(--color-text)] leading-relaxed">
              {analysisResult.empathy}
            </div>
          </div>
        )}
        {feedbackTurns.map((turn, i) => (
          <div key={i} className={`flex ${turn.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] px-4 py-3 text-[13px] leading-relaxed ${
              turn.role === 'user'
                ? 'bg-[var(--color-primary)] text-white rounded-[20px] rounded-br-md'
                : 'bg-[var(--color-bg-secondary)] text-[var(--color-text)] rounded-[20px] rounded-bl-md'
            }`}>
              {turn.message}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-auto pb-2">
        <div className="flex items-center gap-2 p-3 rounded-2xl bg-white"
          style={{ boxShadow: 'var(--app-shadow-card-emphasis)' }}>
          <textarea
            ref={textareaRef}
            value={feedbackInput}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFeedbackInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="예: 절개는 부담스럽고, 회복이 빠른 방법 위주로 보고 싶어요"
            rows={1}
            className="flex-1 resize-none border-0 outline-none bg-transparent text-[14px] text-[var(--color-text)] placeholder:text-[var(--color-text-dim)] leading-relaxed min-h-9 max-h-28 py-1"
          />
          <button
            onClick={handleSubmitFeedback}
            disabled={!feedbackInput.trim()}
            className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 border-0 cursor-pointer transition-colors ${
              feedbackInput.trim()
                ? 'bg-[var(--color-primary)] text-white'
                : 'bg-[var(--color-bg-secondary)] text-[var(--color-text-dim)]'
            }`}>
            <Send size={16} />
          </button>
        </div>
        <p className="text-center text-[10.5px] text-[var(--color-text-dim)] mt-1.5">
          {t('consult.feedbackHint')}
        </p>
      </div>
    </div>
  );
}

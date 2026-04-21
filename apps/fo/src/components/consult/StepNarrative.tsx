'use client';

import { useRef, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@hyliren/ui';
import { ArrowRight } from 'lucide-react';
import { useConcernFlowStore } from '@/store/concern-flow';
import { useLocaleStore } from '@/store/locale';
import { PhotoUploadPanel } from './PhotoUploadPanel';

export function StepNarrative() {
  const t = useLocaleStore(s => s.t);
  const { photos, narrativeInput, addPhoto, removePhoto, setNarrativeInput, setStep } = useConcernFlowStore();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const searchParams = useSearchParams();

  // Pre-populate from query params (area/detail from home page)
  useEffect(() => {
    if (narrativeInput) return; // don't override if already typed
    const area = searchParams.get('area');
    const detail = searchParams.get('detail');
    if (area || detail) {
      const hint = [area, detail].filter(Boolean).join(' ');
      setNarrativeInput(`${hint} 관련 고민이 있어요. `);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 200) + 'px';
  }, [narrativeInput]);

  const canProceed = narrativeInput.trim().length > 0;

  function handleStart() {
    if (!canProceed) return;
    setStep('budget');
  }

  return (
    <div className="flex flex-col min-h-full">
      {/* Header copy */}
      <div className="mb-6">
        <h1 className="text-[1.5rem] font-extrabold text-[var(--color-text)] leading-tight tracking-[-0.3px] whitespace-pre-line mb-2">
          {t('consult.narrativeTitle')}
        </h1>
        <p className="text-[13px] text-[var(--color-text-dim)] leading-[1.6] whitespace-pre-line">
          {t('consult.narrativeDesc')}
        </p>
      </div>

      {/* Photo upload */}
      <div className="mb-6">
        <PhotoUploadPanel photos={photos} onAdd={addPhoto} onRemove={removePhoto} />
      </div>

      {/* Narrative input */}
      <div className="flex-1 mb-6">
        <div className="rounded-2xl bg-white p-4" style={{ boxShadow: 'var(--app-shadow-card-md)' }}>
          <textarea
            ref={textareaRef}
            value={narrativeInput}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNarrativeInput(e.target.value)}
            placeholder="예: 요즘 눈이 처져서 사나워 보이는 게 스트레스예요. 5월에 한국 갈 때 자연스럽게 개선하고 싶어요. 너무 티 나는 건 싫고 예산은 3만 위안 정도 생각 중이에요."
            rows={4}
            className="w-full resize-none border-0 outline-none bg-transparent text-[15px] text-[var(--color-text)] placeholder:text-[var(--color-text-dim)] placeholder:leading-relaxed leading-relaxed min-h-24"
          />
        </div>
      </div>

      {/* CTA */}
      <div className="mt-auto pb-2">
        <Button variant="accent" size="xl" fullWidth onClick={handleStart} disabled={!canProceed}>
          {t('consult.narrativeCta')}
          <ArrowRight size={18} />
        </Button>
      </div>
    </div>
  );
}

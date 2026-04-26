'use client';

import { useRef, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@hyliren/ui';
import { ArrowRight, Sparkles } from 'lucide-react';
import { useConcernFlowStore } from '@/store/concern-flow';
import { useLocaleStore } from '@/store/locale';
import { PhotoUploadPanel } from './PhotoUploadPanel';
import { NARRATIVE_QUALITY_THRESHOLD, narrativeQualityScore } from '@/lib/consult/narrative-quality';

export function StepNarrative() {
  const t = useLocaleStore(s => s.t);
  const { photos, narrativeInput, addPhoto, removePhoto, setNarrativeInput, setStep } = useConcernFlowStore();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const searchParams = useSearchParams();

  // Pre-populate from query params (area/detail from home and procedure detail).
  useEffect(() => {
    const area = searchParams.get('area');
    const detail = searchParams.get('detail');
    const procedure = searchParams.get('procedure');
    const tag = searchParams.get('tag');
    const hasProcedureIntent = Boolean(procedure || tag);
    if (narrativeInput && !hasProcedureIntent) return; // don't override if already typed

    if (area || detail || procedure || tag) {
      const interest = [procedure, tag].filter(Boolean).join(' · ');
      const hint = [area, detail].filter(Boolean).join(' ');
      if (hasProcedureIntent && narrativeInput.includes(interest)) return;
      setNarrativeInput(
        interest && narrativeInput.trim()
          ? `${narrativeInput.trim()}\n\n관심 시술은 ${interest}입니다. `
          : interest
            ? `${hint} 관련 고민이 있어요. 관심 시술은 ${interest}입니다. `
            : `${hint} 관련 고민이 있어요. `,
      );
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 200) + 'px';
  }, [narrativeInput]);

  const trimmed = narrativeInput.trim();
  const qualityScore = narrativeQualityScore(trimmed);
  const canProceed = qualityScore >= NARRATIVE_QUALITY_THRESHOLD;
  const showGuide = trimmed.length > 0 && !canProceed;
  const progressPct = Math.min(100, Math.round((qualityScore / NARRATIVE_QUALITY_THRESHOLD) * 100));

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
        <div className="rounded-[var(--app-radius-md)] bg-[var(--color-bg)] p-4" style={{ boxShadow: 'var(--app-shadow-card-md)' }}>
          <textarea
            ref={textareaRef}
            value={narrativeInput}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNarrativeInput(e.target.value)}
            placeholder={t('consult.narrativePlaceholder')}
            rows={4}
            className="w-full resize-none border-0 outline-none bg-transparent text-[15px] text-[var(--color-text)] placeholder:text-[var(--color-text-dim)] placeholder:leading-relaxed leading-relaxed min-h-24"
          />
        </div>
        {showGuide && (
          <div className="mt-2 px-1">
            <div className="flex items-center gap-1.5 text-[12px] text-[var(--color-text-dim)]">
              <Sparkles size={12} className="text-[var(--color-primary)]" />
              <span>{t('consult.narrativeGuide')}</span>
            </div>
            <div className="mt-1.5 h-1 w-full rounded-full bg-[var(--color-border-light)] overflow-hidden">
              <div
                className="h-full bg-[var(--color-primary)] transition-[width] duration-300"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* CTA */}
      <div className="mt-auto pb-2">
        <Button variant="primary" size="xl" fullWidth onClick={handleStart} disabled={!canProceed}>
          {t('consult.narrativeCta')}
          <ArrowRight size={18} />
        </Button>
      </div>
    </div>
  );
}

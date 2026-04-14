'use client';

import { useState } from 'react';
import { BODY_AREAS, track } from '@hyliren/shared';
import type { BodyArea } from '@hyliren/shared';
import { Button, MobileBottomCTA } from '@hyliren/ui';
import { t } from '@hyliren/i18n';
import { StepBodyArea } from './StepBodyArea';
import { StepPhotos } from './StepPhotos';
import { StepDetails } from './StepDetails';
import { StepComplete } from './StepComplete';

const L = 'ko' as const;

export interface ConcernFormData {
  bodyArea: BodyArea | null;
  bodyAreaDetail: string;
  photos: File[];
  description: string;
  budgetMin: number;
  budgetMax: number;
  visitDateFrom: string;
  visitDateTo: string;
  hasPassport: boolean;
}

const INITIAL: ConcernFormData = {
  bodyArea: null,
  bodyAreaDetail: '',
  photos: [],
  description: '',
  budgetMin: 100,
  budgetMax: 500,
  visitDateFrom: '',
  visitDateTo: '',
  hasPassport: false,
};

const TOTAL_STEPS = 3;

export default function ConcernNewPage() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<ConcernFormData>(INITIAL);
  const [submitted, setSubmitted] = useState(false);

  function update(partial: Partial<ConcernFormData>) {
    setForm(prev => ({ ...prev, ...partial }));
  }

  function canProceed(): boolean {
    if (step === 1) return form.bodyArea !== null;
    if (step === 2) return true;
    if (step === 3) return form.description.trim().length > 0;
    return false;
  }

  function handleNext() {
    if (step < TOTAL_STEPS) {
      setStep(step + 1);
    } else {
      track({ eventType: 'concern_submitted', actorType: 'user', metadata: { source: 'fo', locale: L, label: form.bodyArea || '', value: `${form.budgetMin}-${form.budgetMax}` } });
      setSubmitted(true);
    }
  }

  function handleBack() {
    if (step > 1) setStep(step - 1);
  }

  if (submitted) return <StepComplete form={form} />;

  return (
    <div className="flex flex-col min-h-dvh">
      {/* Header */}
      <header className="flex items-center gap-3 h-14 px-4 border-b border-[var(--color-border-light)]">
        <button
          onClick={handleBack}
          disabled={step === 1}
          className="flex items-center justify-center w-10 h-10 rounded-full text-xl text-[var(--color-text)] disabled:opacity-30 hover:bg-[var(--color-bg-secondary)] cursor-pointer border-none bg-transparent"
        >←</button>
        <div className="flex-1 h-1 bg-[var(--color-border-light)] rounded-full overflow-hidden">
          <div className="h-full bg-[var(--color-primary)] rounded-full transition-all duration-200" style={{ width: `${(step / TOTAL_STEPS) * 100}%` }} />
        </div>
        <span className="text-xs text-[var(--color-text-dim)] whitespace-nowrap">{step}/{TOTAL_STEPS}</span>
      </header>

      {/* Content */}
      <main className="flex-1 px-4 pt-6 pb-24 overflow-y-auto">
        {step === 1 && <StepBodyArea form={form} update={update} />}
        {step === 2 && <StepPhotos form={form} update={update} />}
        {step === 3 && <StepDetails form={form} update={update} />}
      </main>

      {/* CTA */}
      <MobileBottomCTA>
        <Button variant="primary" fullWidth size="lg" onClick={handleNext} disabled={!canProceed()}>
          {step === TOTAL_STEPS ? t(L, 'concern.form.submitButton') : t(L, 'common.next')}
        </Button>
      </MobileBottomCTA>
    </div>
  );
}

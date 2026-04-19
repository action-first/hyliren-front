'use client';

import { Button } from '@hyliren/ui';
import { ArrowRight } from 'lucide-react';
import { useConcernFlowStore } from '@/store/concern-flow';
import { useLocaleStore } from '@/store/locale';

const BODY_AREAS = [
  { key: '눈', label: '눈', emoji: '👁️', examples: '쌍꺼풀, 눈밑지방, 눈매교정' },
  { key: '코', label: '코', emoji: '👃', examples: '코끝, 콧대, 코성형' },
  { key: '리프팅', label: '리프팅', emoji: '✨', examples: '울쎄라, 써마지, 실리프팅' },
  { key: '피부', label: '피부', emoji: '🧴', examples: '기미, 모공, 스킨부스터' },
  { key: '다이어트', label: '다이어트', emoji: '💪', examples: '지방흡입, 비만 시술' },
  { key: '기타', label: '기타', emoji: '💬', examples: '안면윤곽, 치아, 기타' },
];

export function StepBodyArea() {
  const t = useLocaleStore(s => s.t);
  const { selectedBodyArea, setSelectedBodyArea, setStep } = useConcernFlowStore();

  function handleNext() {
    if (!selectedBodyArea) return;
    setStep('narrative');
  }

  return (
    <div className="flex flex-col px-5 pt-6 pb-10">
      <h1 className="text-[1.25rem] font-bold text-[var(--color-text)] leading-tight mb-1">
        {t('concern.form.bodyAreaTitle')}
      </h1>
      <p className="text-[13px] text-[var(--color-text-dim)] mb-6">
        {t('concern.form.bodyAreaSubtitle')}
      </p>

      <div className="flex flex-col gap-2.5 mb-8">
        {BODY_AREAS.map(area => (
          <button
            key={area.key}
            type="button"
            onClick={() => setSelectedBodyArea(area.key)}
            className={`flex items-center gap-3.5 px-4 py-4 rounded-xl border-0 cursor-pointer transition-all text-left ${
              selectedBodyArea === area.key
                ? 'bg-[var(--color-primary-soft)] ring-2 ring-[var(--color-primary)] ring-offset-1'
                : 'bg-white'
            }`}
            style={selectedBodyArea !== area.key ? { boxShadow: '0 0 0 1px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)' } : undefined}
          >
            <span className="text-[1.5rem]">{area.emoji}</span>
            <div className="flex-1">
              <span className={`text-[14px] block ${selectedBodyArea === area.key ? 'font-bold text-[var(--color-primary)]' : 'font-medium text-[var(--color-text)]'}`}>
                {area.label}
              </span>
              <span className="text-[11px] text-[var(--color-text-dim)]">{area.examples}</span>
            </div>
          </button>
        ))}
      </div>

      <Button
        variant="accent"
        size="lg"
        fullWidth
        disabled={!selectedBodyArea}
        onClick={handleNext}
      >
        다음 <ArrowRight size={16} />
      </Button>
    </div>
  );
}

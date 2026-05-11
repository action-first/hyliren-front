'use client';

import { useRef, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@hyliren/ui';
import { ArrowRight, Sparkles } from 'lucide-react';
import { useConcernFlowStore } from '@/store/concern-flow';
import { useLocaleStore } from '@/store/locale';
import { PhotoUploadPanel } from './PhotoUploadPanel';
import { NARRATIVE_QUALITY_THRESHOLD, narrativeQualityScore } from '@/lib/consult/narrative-quality';

const VALID_BODY_AREAS = new Set(['skin', 'lifting', 'eyes', 'diet', 'nose', 'etc']);

export function StepNarrative() {
  const t = useLocaleStore(s => s.t);
  const {
    photos, narrativeInput, addPhoto, removePhoto, setNarrativeInput, setStep,
    selectedBodyArea, bodyAreaDetail, setSelectedBodyArea, setBodyAreaDetail,
  } = useConcernFlowStore();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const searchParams = useSearchParams();

  /**
   * Query params → store 매핑 only. textarea 자동 한국어 조합 금지 (sourceLocale 오염 차단).
   * - 랜딩: ?area={enum}&detailKey={i18n key} → t(detailKey) 로 사용자 언어 detail 저장
   * - procedure 상세: ?area={enum}&detail={BE 응답 다국어 title}&procedure=...&tag=...
   *   → BE 가 Accept-Language 로 사용자 언어 응답하므로 그대로 사용 가능
   * 사용자가 textarea 에 자기 언어로 직접 작성. 자동 prefill 제거.
   */
  useEffect(() => {
    const area = searchParams.get('area');
    const detail = searchParams.get('detail');
    const detailKey = searchParams.get('detailKey');

    if (area && VALID_BODY_AREAS.has(area) && !selectedBodyArea) {
      setSelectedBodyArea(area);
    }
    if (!bodyAreaDetail) {
      if (detailKey) {
        setBodyAreaDetail(t(detailKey));
      } else if (detail) {
        setBodyAreaDetail(detail);
      }
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

      {/* Prefill chip — 랜딩/시술 상세에서 진입한 경우 부위/디테일 정보를 보존 표시 (사용자 직접 작성 영역은 비워둠) */}
      {(selectedBodyArea || bodyAreaDetail) && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {selectedBodyArea && (
            <span className="px-2.5 py-1 rounded-[var(--app-radius-sm)] bg-[var(--color-info-soft)] text-[11px] font-medium text-[var(--color-info)]">
              {t(`common.bodyArea.${selectedBodyArea}`)}
            </span>
          )}
          {bodyAreaDetail && (
            <span className="px-2.5 py-1 rounded-[var(--app-radius-sm)] bg-[var(--color-bg-secondary)] text-[11px] font-medium text-[var(--color-text-secondary)]">
              {bodyAreaDetail}
            </span>
          )}
        </div>
      )}

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

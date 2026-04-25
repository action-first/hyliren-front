'use client';

import type { AnalysisResponse } from '@/server/concern-analysis/types';
import { Sparkles, Shield } from 'lucide-react';
import { useLocaleStore } from '@/store/locale';

interface Props {
  result: AnalysisResponse;
  compact?: boolean;
}

export function AIAnalysisResultCard({ result, compact = false }: Props) {
  const t = useLocaleStore(s => s.t);
  const { extractedSummary, options, disclaimer } = result;

  const rows = [
    { label: t('consult.summaryArea'), value: extractedSummary.bodyAreas?.join(' · ') || extractedSummary.primaryArea },
    { label: t('consult.summaryDetail'), value: extractedSummary.bodyAreaDetail },
    { label: t('consult.summaryDirection'), value: extractedSummary.desiredOutcome },
    { label: t('consult.summaryBudget'), value: extractedSummary.budgetMax ? `${extractedSummary.budgetMax.toLocaleString()}${t('common.currency')}` : t('common.tbd') },
    { label: t('consult.summaryTiming'), value: extractedSummary.visitDate || t('common.tbd') },
  ].filter(r => r.value);

  return (
    <div className="rounded-[var(--app-radius-md)] bg-[var(--color-bg)] overflow-hidden" style={{ boxShadow: 'var(--app-shadow-card-md)' }}>
      <div className="flex items-center gap-2 px-4 py-2.5 fo-gradient-accent">
        <Sparkles size={14} className="text-[var(--color-primary)]" />
        <span className="text-[12px] font-semibold text-[var(--color-text)]">{t('consult.summaryTitle')}</span>
      </div>

      <div className={compact ? 'px-4 py-2.5' : 'px-4 py-3'}>
        <div className="flex flex-col gap-2">
          {rows.map(r => (
            <div key={r.label} className="flex items-start justify-between">
              <span className="text-[11px] text-[var(--color-text-dim)] shrink-0">{r.label}</span>
              <span className="text-[12px] font-medium text-[var(--color-text)] text-right">{r.value}</span>
            </div>
          ))}
        </div>

        {options.length > 0 && (
          <div className="mt-3 pt-3 border-t border-[var(--color-border-light)]">
            <span className="text-[10px] text-[var(--color-text-dim)] block mb-2">{t('consult.summaryProcedures')}</span>
            <div className="flex flex-col gap-2">
              {options.map(opt => (
                <div key={opt.key} className="px-3 py-2.5 rounded-[var(--app-radius)] bg-[var(--color-bg-secondary)]">
                  <span className="text-[12px] font-semibold text-[var(--color-text)] block mb-0.5">{opt.name}</span>
                  <span className="text-[11px] text-[var(--color-text-dim)] leading-relaxed">{opt.description}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {!compact && result.extractedTags.symptoms.length > 0 && (
          <div className="flex gap-1 flex-wrap mt-2.5">
            {result.extractedTags.symptoms.filter(s => !s.includes('미분류')).map(s => (
              <span key={s} className="px-1.5 py-0.5 rounded text-[9.5px] text-[var(--color-primary)] bg-[var(--color-primary-soft)]">#{s.replace(/_/g, '')}</span>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-start gap-1.5 px-4 py-2.5 bg-[var(--color-bg-secondary)] border-t border-[var(--color-border-light)]">
        <Shield size={11} className="text-[var(--color-text-dim)] shrink-0 mt-0.5" />
        <span className="text-[10px] text-[var(--color-text-dim)] leading-relaxed">{disclaimer}</span>
      </div>
    </div>
  );
}

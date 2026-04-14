'use client';

import type { AnalysisResponse } from '@/server/concern-analysis/types';
import { Sparkles, Shield } from 'lucide-react';

interface Props {
  result: AnalysisResponse;
  compact?: boolean;
}

export function AIAnalysisResultCard({ result, compact = false }: Props) {
  const { extractedSummary, options, disclaimer } = result;

  const rows = [
    { label: '고민 부위', value: extractedSummary.bodyAreas?.join(' · ') || extractedSummary.primaryArea },
    { label: '세부', value: extractedSummary.bodyAreaDetail },
    { label: '원하는 방향', value: extractedSummary.desiredOutcome },
    { label: '예산', value: extractedSummary.budgetMax ? `${extractedSummary.budgetMax.toLocaleString()}만원` : '미정' },
    { label: '방문 시기', value: extractedSummary.visitDate || '미정' },
  ].filter(r => r.value);

  return (
    <div className="rounded-2xl bg-white overflow-hidden" style={{ boxShadow: '0 0 0 1px rgba(0,0,0,0.06), 0 2px 8px rgba(0,0,0,0.04)' }}>
      <div className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[var(--color-primary-soft)] to-[#fff5f7]">
        <Sparkles size={14} className="text-[var(--color-primary)]" />
        <span className="text-[12px] font-semibold text-[var(--color-text)]">분석 요약</span>
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
            <span className="text-[10px] text-[var(--color-text-dim)] block mb-2">일반적으로 고려되는 시술</span>
            <div className="flex flex-col gap-2">
              {options.map(opt => (
                <div key={opt.key} className="px-3 py-2.5 rounded-xl bg-[var(--color-bg-secondary)]">
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

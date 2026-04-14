'use client';

import type { AISummary } from '@/store/consult';
import { Sparkles } from 'lucide-react';

interface AISummaryCardProps {
  summary: AISummary;
  onEdit?: () => void;
}

const LABEL_MAP: Record<string, string> = {
  bodyArea: '고민 부위',
  bodyAreaDetail: '세부 시술',
  intent: '원하는 스타일',
  budgetEstimate: '예상 예산',
  riskPreference: '위험 선호도',
};

const RISK_LABELS: Record<string, string> = {
  low: '안전 우선 (빠른 회복)',
  medium: '적정 수준',
  high: '적극적 시술 선호',
};

export function AISummaryCard({ summary, onEdit }: AISummaryCardProps) {
  const rows = [
    { label: LABEL_MAP.bodyArea, value: summary.bodyArea },
    { label: LABEL_MAP.bodyAreaDetail, value: summary.bodyAreaDetail },
    { label: LABEL_MAP.intent, value: summary.intent },
    { label: LABEL_MAP.budgetEstimate, value: summary.budgetEstimate ? `${summary.budgetEstimate}만원` : '미정' },
    { label: LABEL_MAP.riskPreference, value: RISK_LABELS[summary.riskPreference] || summary.riskPreference },
  ];

  return (
    <div className="rounded-2xl bg-white overflow-hidden"
      style={{ boxShadow: '0 0 0 1px rgba(0,0,0,0.06), 0 2px 8px rgba(0,0,0,0.06)' }}>

      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-[var(--color-primary-soft)] to-[#fff5f7]">
        <div className="w-7 h-7 rounded-full bg-white flex items-center justify-center">
          <Sparkles size={14} className="text-[var(--color-primary)]" />
        </div>
        <span className="text-[13px] font-semibold text-[var(--color-text)]">AI 분석 결과</span>
      </div>

      {/* Summary rows */}
      <div className="px-4 py-3">
        <div className="flex flex-col gap-3">
          {rows.map(row => (
            <div key={row.label} className="flex items-start justify-between">
              <span className="text-[12px] text-[var(--color-text-dim)] shrink-0">{row.label}</span>
              <span className="text-[13px] font-medium text-[var(--color-text)] text-right">{row.value}</span>
            </div>
          ))}
        </div>

        {/* Keywords */}
        {summary.keywords.length > 0 && (
          <div className="flex gap-1.5 flex-wrap mt-3 pt-3 border-t border-[var(--color-border-light)]">
            {summary.keywords.map(kw => (
              <span key={kw} className="px-2 py-0.5 rounded-full bg-[var(--color-primary-soft)] text-[11px] font-medium text-[var(--color-primary)]">
                #{kw}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Edit button */}
      {onEdit && (
        <div className="px-4 pb-3">
          <button
            onClick={onEdit}
            className="w-full py-2 rounded-xl bg-[var(--color-bg-secondary)] text-[13px] font-medium text-[var(--color-text-secondary)] border-0 cursor-pointer">
            수정하기
          </button>
        </div>
      )}
    </div>
  );
}

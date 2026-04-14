'use client';

import React from 'react';
import { Input, Textarea } from '@hyliren/ui';
import type { ConcernFormData } from './page';

interface Props {
  form: ConcernFormData;
  update: (partial: Partial<ConcernFormData>) => void;
}

export function StepDetails({ form, update }: Props) {
  return (
    <div>
      <h1 className="text-2xl font-bold text-[var(--color-text)]">상세 정보를 알려주세요</h1>
      <p className="text-base text-[var(--color-text-secondary)] mt-2 leading-relaxed">더 정확한 제안서를 위한 정보입니다</p>

      <div className="flex flex-col gap-5 mt-6">
        <Textarea label="고민 내용" placeholder="어떤 점이 고민인지 자유롭게 적어주세요" value={form.description} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => update({ description: e.target.value })} rows={4} />

        {/* Budget */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-[var(--color-text)]">예산 범위 (만원)</label>
          <div className="flex items-center justify-center gap-3">
            <span className="text-xl font-bold text-[var(--color-text)]">{form.budgetMin}만</span>
            <span className="text-[var(--color-text-dim)]">~</span>
            <span className="text-xl font-bold text-[var(--color-text)]">{form.budgetMax}만</span>
          </div>
          <div className="flex flex-col gap-2">
            <input type="range" min={0} max={2000} step={50} value={form.budgetMin}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => update({ budgetMin: Math.min(Number(e.target.value), form.budgetMax) })}
              className="w-full h-8 accent-[var(--color-primary)]" />
            <input type="range" min={0} max={2000} step={50} value={form.budgetMax}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => update({ budgetMax: Math.max(Number(e.target.value), form.budgetMin) })}
              className="w-full h-8 accent-[var(--color-primary)]" />
          </div>
        </div>

        {/* Visit date */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-[var(--color-text)]">방문 예정 시기</label>
          <div className="flex items-center gap-2">
            <div className="flex-1"><Input type="date" value={form.visitDateFrom} onChange={(e: React.ChangeEvent<HTMLInputElement>) => update({ visitDateFrom: e.target.value })} /></div>
            <span className="text-[var(--color-text-dim)] shrink-0">~</span>
            <div className="flex-1"><Input type="date" value={form.visitDateTo} onChange={(e: React.ChangeEvent<HTMLInputElement>) => update({ visitDateTo: e.target.value })} /></div>
          </div>
        </div>

        {/* Passport */}
        <label className="flex items-center gap-3 py-3 cursor-pointer">
          <input type="checkbox" checked={form.hasPassport} onChange={(e: React.ChangeEvent<HTMLInputElement>) => update({ hasPassport: e.target.checked })}
            className="w-5 h-5 accent-[var(--color-primary)] shrink-0" />
          <span className="text-base text-[var(--color-text)]">여권을 보유하고 있습니다</span>
        </label>
      </div>
    </div>
  );
}

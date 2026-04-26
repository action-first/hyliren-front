'use client';

import { useState } from 'react';
import { Badge, Button } from '@hyliren/ui';
import { Eye, EyeOff } from 'lucide-react';
import type { Locale } from '@hyliren/shared';
import { pickI18n, getEffectiveVariant } from '@hyliren/shared/src/domain/procedure';
import type { WizardForm } from '@/lib/wizard/types';
import { PO_WIZARD_LOCALES } from './config';

interface Step4Props {
  form: WizardForm;
  /** 공개 전환 액션 (edit mode 에서 전달). 없으면 banner 미노출. */
  onPublish?: () => void;
  /** 공개 요건 미충족 시 버튼 disabled. */
  publishDisabled?: boolean;
  /** 공개 API 진행 중 */
  publishing?: boolean;
}

/**
 * 전체 FO 상세페이지를 시뮬레이션하는 preview.
 * pickI18n + getEffectiveVariant 를 그대로 써서 실제 FO 렌더와 동일한 fallback 적용.
 */
export function Step4Preview({ form, onPublish, publishDisabled, publishing }: Step4Props) {
  const [previewLocale, setPreviewLocale] = useState<Locale>(form.sourceLocale);

  const i18n = pickI18n(form.i18n, previewLocale, form.sourceLocale);
  const title = i18n?.content.title || '(제목 없음)';
  const description = i18n?.content.description || '';
  const precautions = i18n?.content.precautions || '';
  const indications = i18n?.content.indications || [];
  const fallback = i18n?.fallback ?? true;

  const variantsWithEffective = form.variants
    .slice()
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map(v => {
      const eff = getEffectiveVariant(v, form);
      const vi = pickI18n(v.i18n, previewLocale, form.sourceLocale);
      return {
        ...eff,
        id: v.id,
        isDefault: v.isDefault,
        name: vi?.content.name || '(이름 없음)',
        description: vi?.content.description ?? null,
        fallback: vi?.fallback ?? true,
      };
    });

  const prices = variantsWithEffective.map(v => v.price);
  const priceMin = prices.length ? Math.min(...prices) : form.basePrice;
  const priceMax = prices.length ? Math.max(...prices) : form.basePrice;

  return (
    <div className="flex flex-col gap-4">
      {/* 공개 상태 배너 — edit mode 에서만 (onPublish 전달 시) */}
      {onPublish && (
        form.status === 'draft' ? (
          <section className="flex items-center justify-between gap-3 p-3 rounded-md border border-[var(--color-warning)] bg-[var(--color-warning-soft)]">
            <div className="flex items-center gap-2">
              <EyeOff size={16} className="text-[var(--color-warning)]" />
              <div>
                <p className="text-[var(--text-xs)] font-semibold text-[var(--text-default)]">비공개 (임시저장)</p>
                <p className="text-[var(--app-text-micro)] text-[var(--text-disabled)]">
                  고객에게 아직 노출되지 않습니다. 검토 후 공개하세요.
                </p>
              </div>
            </div>
            <Button
              variant="accent" size="sm"
              onClick={onPublish}
              disabled={publishDisabled || publishing}
            >
              {publishing ? '공개 중...' : '공개하기'}
            </Button>
          </section>
        ) : form.status === 'published' ? (
          <section className="flex items-center gap-2 p-3 rounded-md border border-[var(--color-success)] bg-[var(--color-success-soft)]">
            <Eye size={16} className="text-[var(--color-success)]" />
            <p className="text-[var(--text-xs)] font-semibold text-[var(--text-default)]">
              공개 중 · 고객에게 노출되고 있습니다.
            </p>
          </section>
        ) : null
      )}

      {/* 상단: locale 선택 */}
      <section className="flex items-center gap-3 p-3 rounded-md bg-[var(--surface-default)]">
        <span className="text-[var(--text-xs)] font-medium text-[var(--text-disabled)]">미리보기 언어</span>
        <div className="flex gap-1">
          {PO_WIZARD_LOCALES.map(loc => (
            <button
              key={loc}
              type="button"
              onClick={() => setPreviewLocale(loc)}
              className={`
                px-2.5 py-1 rounded text-[var(--app-text-micro)] font-medium
                ${previewLocale === loc
                  ? 'bg-[var(--interactive-default)] text-white'
                  : 'bg-white text-[var(--text-default)] border border-[var(--border-default)]'}
              `}
            >
              {loc}
            </button>
          ))}
        </div>
        {fallback && (
          <span className="text-[var(--app-text-micro)] text-[var(--text-disabled)]">
            ⓘ {previewLocale} 번역 없음 → {form.sourceLocale} 원본 표시
          </span>
        )}
      </section>

      {/* FO 미리보기 */}
      <div className="rounded-lg border border-[var(--border-default)] overflow-hidden bg-white">
        {/* Hero */}
        <div className="h-56 bg-[var(--surface-subdued)] overflow-hidden">
          {form.heroImageUrl
            ? <img src={form.heroImageUrl} alt="" className="w-full h-full object-cover" />
            : <div className="w-full h-full flex items-center justify-center text-[var(--text-disabled)]">이미지 없음</div>}
        </div>
        <div className="p-5">
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="info" size="sm">{form.primaryArea || '미분류'}</Badge>
          </div>
          <h1 className="text-[20px] font-bold text-[var(--text-default)] mb-1">{title}</h1>
          <p className="text-[var(--text-base)] text-[var(--text-subdued)] mb-4">
            {priceMin === priceMax
              ? `${priceMin.toLocaleString()}원`
              : `${priceMin.toLocaleString()}원 ~ ${priceMax.toLocaleString()}원`}
          </p>

          {indications.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-4">
              {indications.map((ind, i) => (
                <span key={i} className="px-2 py-1 rounded-full bg-[var(--surface-subdued)] text-[var(--app-text-micro)]">
                  {ind}
                </span>
              ))}
            </div>
          )}

          <section className="mb-5">
            <h3 className="text-[var(--text-sm)] font-bold text-[var(--text-default)] mb-2">시술 개요</h3>
            <p className="text-[var(--text-sm)] leading-relaxed text-[var(--text-subdued)] whitespace-pre-wrap">
              {description || <span className="text-[var(--text-disabled)]">(미입력)</span>}
            </p>
          </section>

          <section className="mb-5">
            <h3 className="text-[var(--text-sm)] font-bold text-[var(--text-default)] mb-2">옵션</h3>
            <div className="flex flex-col gap-2">
              {variantsWithEffective.map(v => (
                <div
                  key={v.id}
                  className={`
                    rounded-md p-3 border
                    ${v.isDefault
                      ? 'border-[var(--interactive-default)] bg-[var(--color-info-soft)]'
                      : 'border-[var(--border-default)]'}
                  `}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[var(--text-sm)] font-semibold">{v.name}</span>
                    <span className="text-[var(--text-sm)] font-bold">{v.price.toLocaleString()}원</span>
                  </div>
                  {v.description && (
                    <p className="text-[var(--text-xs)] text-[var(--text-subdued)] mb-1.5">{v.description}</p>
                  )}
                  <div className="flex gap-3 text-[var(--app-text-micro)] text-[var(--text-disabled)]">
                    <span>마취: {v.anesthesia}</span>
                    <span>시술 {v.durationMinutes}분</span>
                    <span>회복 {v.recoveryDays}일</span>
                    {v.hospitalStayDays > 0 && <span>입원 {v.hospitalStayDays}일</span>}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h3 className="text-[var(--text-sm)] font-bold text-[var(--text-default)] mb-2">⚠️ 필수 고지</h3>
            <p className="text-[var(--text-xs)] leading-relaxed text-[var(--text-subdued)] whitespace-pre-wrap">
              {precautions || <span className="text-[var(--text-disabled)]">(미입력)</span>}
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

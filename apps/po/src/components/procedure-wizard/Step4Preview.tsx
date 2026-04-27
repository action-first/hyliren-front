'use client';

import { useState } from 'react';
import { Badge } from '@hyliren/ui';
import { Check, Eye, EyeOff, FileEdit, AlertCircle } from 'lucide-react';
import type { Locale } from '@hyliren/shared';
import { pickI18n, getEffectiveVariant } from '@hyliren/shared/src/domain/procedure';
import { stepIsValid } from '@/lib/wizard/validation';
import type { WizardForm } from '@/lib/wizard/types';
import { PO_WIZARD_LOCALES } from './config';

interface Step4Props {
  form: WizardForm;
}

/** 공개 전 점검 — step 별 누락 항목 진단. */
function diagnoseSteps(form: WizardForm): Array<{ label: string; ok: boolean; missing: string[] }> {
  const sourceBlock = form.i18n[form.sourceLocale];
  return [
    {
      label: '기본 정보',
      ok: stepIsValid(form, 0),
      missing: [
        !form.primaryArea && '분류',
        !form.procedureType && '시술 유형',
        !form.heroImageUrl && '대표 이미지',
        !sourceBlock?.title?.trim() && '시술명',
      ].filter(Boolean) as string[],
    },
    {
      label: '가격·옵션',
      ok: stepIsValid(form, 1),
      missing: [
        form.basePrice <= 0 && '기본 가격',
        form.baseDurationMinutes <= 0 && '시술 시간',
        form.variants.length < 1 && '옵션 1개 이상',
        form.variants.filter(v => v.isDefault).length !== 1 && '대표 옵션 1개',
        form.variants.some(v => !(v.i18n[form.sourceLocale]?.name?.trim())) && '옵션 이름',
      ].filter(Boolean) as string[],
    },
    {
      label: '상세·이미지',
      ok: stepIsValid(form, 2),
      missing: [
        !sourceBlock?.description?.trim() && '시술 설명',
        !sourceBlock?.precautions?.trim() && '주의사항',
      ].filter(Boolean) as string[],
    },
  ];
}

/**
 * 전체 FO 상세페이지를 시뮬레이션하는 preview.
 * pickI18n + getEffectiveVariant 를 그대로 써서 실제 FO 렌더와 동일한 fallback 적용.
 *
 * 배너는 status 정보 전용 (액션 버튼 없음) — 공개/저장 트리거는 wizard footer 의
 * primaryAction 으로 단일화 (1 화면 1 primary CTA 원칙).
 */
export function Step4Preview({ form }: Step4Props) {
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
      {/* 상태 정보 배너 (액션 없음) — 공개/저장은 wizard footer primary 로. */}
      {form.status === 'draft' && (
        <section className="flex items-center gap-2 p-3 rounded-md border border-[var(--color-warning)] bg-[var(--color-warning-soft)]">
          <FileEdit size={16} className="text-[var(--color-warning)]" />
          <div>
            <p className="text-[var(--text-xs)] font-semibold text-[var(--text-default)]">임시저장 상태</p>
            <p className="text-[var(--app-text-micro)] text-[var(--text-disabled)]">
              고객에게 아직 노출되지 않습니다. 검토 후 우측 상단 '공개하기' 버튼으로 공개하세요.
            </p>
          </div>
        </section>
      )}
      {form.status === 'published' && (
        <section className="flex items-center gap-2 p-3 rounded-md border border-[var(--color-success)] bg-[var(--color-success-soft)]">
          <Eye size={16} className="text-[var(--color-success)]" />
          <p className="text-[var(--text-xs)] font-semibold text-[var(--text-default)]">
            공개 중 · 고객에게 노출되고 있습니다.
          </p>
        </section>
      )}
      {form.status === 'archived' && (
        <section className="flex items-center gap-2 p-3 rounded-md border border-[var(--border-default)] bg-[var(--surface-subdued)]">
          <EyeOff size={16} className="text-[var(--text-subdued)]" />
          <p className="text-[var(--text-xs)] font-semibold text-[var(--text-default)]">
            비공개 상태 · 고객에게 노출되지 않습니다.
          </p>
        </section>
      )}

      {/* 공개 전 점검 — draft 한정 (published/archived 는 이미 검증된 데이터). */}
      {form.status === 'draft' && (() => {
        const diagnostics = diagnoseSteps(form);
        const allOk = diagnostics.every(d => d.ok);
        const totalVariants = form.variants.length;
        const itemNames = form.variants
          .slice()
          .sort((a, b) => a.sortOrder - b.sortOrder)
          .map(v => v.i18n[form.sourceLocale]?.name)
          .filter(Boolean) as string[];
        const prices = form.variants.map(v => getEffectiveVariant(v, form).price).filter(p => p > 0);
        const priceMin = prices.length ? Math.min(...prices) : form.basePrice;
        const priceMax = prices.length ? Math.max(...prices) : form.basePrice;

        return (
          <section className="rounded-lg border border-[var(--border-default)] bg-[var(--surface-default)] p-4 flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <h2 className="text-[var(--text-sm)] font-semibold text-[var(--text-default)]">공개 전 점검</h2>
              {allOk ? (
                <span className="text-[var(--app-text-micro)] text-[var(--color-success)] font-medium">공개 준비 완료</span>
              ) : (
                <span className="text-[var(--app-text-micro)] text-[var(--color-warning)] font-medium">누락된 항목이 있습니다</span>
              )}
            </div>

            {/* step 별 체크리스트 */}
            <ul className="flex flex-col gap-2">
              {diagnostics.map((d, i) => (
                <li key={i} className="flex items-start gap-2">
                  {d.ok ? (
                    <Check size={16} className="text-[var(--color-success)] shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle size={16} className="text-[var(--color-warning)] shrink-0 mt-0.5" />
                  )}
                  <div className="min-w-0">
                    <p className={`text-[var(--text-sm)] font-medium ${d.ok ? 'text-[var(--text-default)]' : 'text-[var(--text-default)]'}`}>
                      {i + 1}단계 · {d.label}
                    </p>
                    {!d.ok && d.missing.length > 0 && (
                      <p className="text-[var(--app-text-micro)] text-[var(--text-subdued)] mt-0.5">
                        누락: {d.missing.join(', ')}
                      </p>
                    )}
                  </div>
                </li>
              ))}
            </ul>

            {/* summary chips — 옵션 개수, 가격 범위, 시술명 태그 */}
            {allOk && (
              <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-[var(--border-subdued)]">
                <span className="px-2 py-0.5 rounded-full bg-[var(--surface-subdued)] text-[var(--app-text-micro)] text-[var(--text-default)]">
                  옵션 {totalVariants}개
                </span>
                {prices.length > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-[var(--surface-subdued)] text-[var(--app-text-micro)] text-[var(--text-default)]">
                    {priceMin === priceMax
                      ? `${(priceMin / 10000).toFixed(0)}만원`
                      : `${(priceMin / 10000).toFixed(0)}~${(priceMax / 10000).toFixed(0)}만원`}
                  </span>
                )}
                {itemNames.slice(0, 3).map((name, i) => (
                  <span key={i} className="px-2 py-0.5 rounded-full bg-[var(--color-info-soft)] text-[var(--app-text-micro)] text-[var(--text-default)]">
                    {name}
                  </span>
                ))}
                {itemNames.length > 3 && (
                  <span className="text-[var(--app-text-micro)] text-[var(--text-disabled)]">
                    +{itemNames.length - 3}
                  </span>
                )}
              </div>
            )}

            {allOk && (
              <p className="text-[var(--app-text-micro)] text-[var(--text-subdued)] leading-relaxed">
                공개하면 위 시술명·가격 범위가 고객의 상담 신청 화면에 노출됩니다.
                하단 <span className="font-semibold text-[var(--text-default)]">공개하기</span> 버튼을 누르면 즉시 반영됩니다.
              </p>
            )}
          </section>
        );
      })()}

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

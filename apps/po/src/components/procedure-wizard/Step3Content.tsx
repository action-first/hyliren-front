'use client';

import { useState } from 'react';
import { Input, Textarea, Button } from '@hyliren/ui';
import { X, Plus } from 'lucide-react';
import type { Locale } from '@hyliren/shared';
import { LocaleTabs } from './LocaleTabs';
import type { WizardForm } from '@/lib/wizard/types';

interface Step3Props {
  form: WizardForm;
  onChange: (patch: Partial<WizardForm>) => void;
}

export function Step3Content({ form, onChange }: Step3Props) {
  const [activeLocale, setActiveLocale] = useState<Locale>(form.sourceLocale);
  const [indicationInput, setIndicationInput] = useState('');

  const completed: Partial<Record<Locale, boolean>> = {};
  for (const [loc, block] of Object.entries(form.i18n)) {
    if (block?.description && block?.precautions) completed[loc as Locale] = true;
  }
  const block = form.i18n[activeLocale] ?? { title: '', description: '', precautions: '', indications: [] };

  function updateBlock(patch: Partial<typeof block>) {
    onChange({
      i18n: {
        ...form.i18n,
        [activeLocale]: { ...block, ...patch },
      },
    });
  }

  function addIndication() {
    const v = indicationInput.trim();
    if (!v || block.indications.length >= 5) return;
    updateBlock({ indications: [...block.indications, v] });
    setIndicationInput('');
  }

  function removeIndication(idx: number) {
    updateBlock({ indications: block.indications.filter((_, i) => i !== idx) });
  }

  const [pendingUrl, setPendingUrl] = useState('');
  const [adding, setAdding] = useState(false);

  function removeGalleryAt(i: number) {
    onChange({ galleryImageUrls: form.galleryImageUrls.filter((_, idx) => idx !== i) });
  }

  function commitPendingUrl() {
    const u = pendingUrl.trim();
    setPendingUrl('');
    setAdding(false);
    if (!u) return;
    if (form.galleryImageUrls.length >= 8) return;
    onChange({ galleryImageUrls: [...form.galleryImageUrls, u] });
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-[var(--text-xs)] text-[var(--text-disabled)] mb-3">
          시술 개요·필수 고지·적응증을 언어별로 입력하세요.
        </p>
        <LocaleTabs
          active={activeLocale}
          sourceLocale={form.sourceLocale}
          completed={completed}
          onChange={setActiveLocale}
        />

        <div className="flex flex-col gap-4">
          <Textarea
            label="시술 개요 *"
            value={block.description}
            onChange={e => updateBlock({ description: e.target.value })}
            rows={5}
            placeholder="시술의 특징·접근법·적합 대상 등을 설명해주세요 (최대 2000자)"
          />
          <Textarea
            label="필수 고지 * (회복 기간·주의사항·예상 부작용)"
            value={block.precautions}
            onChange={e => updateBlock({ precautions: e.target.value })}
            rows={4}
            placeholder="의료법상 필수 고지 사항 (최대 500자)"
          />

          <div>
            <label className="block text-[var(--text-xs)] font-semibold text-[var(--text-disabled)] mb-1">
              적응증 (최대 5개)
            </label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {block.indications.map((ind, i) => (
                <span key={i} className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-[var(--surface-subdued)] text-[var(--app-text-micro)]">
                  {ind}
                  <button
                    type="button"
                    onClick={() => removeIndication(i)}
                    className="text-[var(--text-disabled)] hover:text-[var(--color-danger)]"
                  >
                    <X size={11} />
                  </button>
                </span>
              ))}
            </div>
            {block.indications.length < 5 && (
              <div className="flex gap-2">
                <Input
                  value={indicationInput}
                  onChange={e => setIndicationInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addIndication())}
                  placeholder="예: 쌍꺼풀 미형성"
                  className="flex-1"
                />
                <Button variant="secondary" size="sm" onClick={addIndication}>
                  <Plus size={13} /> 추가
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-[var(--text-xs)] text-[var(--text-disabled)]">
            갤러리 이미지 (최대 8장) — <strong>시술 전/후 비교 금지</strong>. 시설·과정·의료진 이미지만.
          </p>
          <span className="text-[var(--app-text-micro)] text-[var(--text-disabled)]">
            {form.galleryImageUrls.length}/8
          </span>
        </div>

        <div className="grid grid-cols-5 gap-2">
          {form.galleryImageUrls.map((url, i) => (
            <div
              key={i}
              className="
                relative group aspect-square rounded-md overflow-hidden
                border border-[var(--border-default)] bg-[var(--surface-subdued)]
              "
            >
              <img src={url} alt="" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => removeGalleryAt(i)}
                title="삭제"
                className="
                  absolute top-1 right-1 p-1 rounded-full
                  bg-black/55 text-white opacity-0 group-hover:opacity-100
                  transition-opacity
                "
              >
                <X size={11} />
              </button>
            </div>
          ))}

          {form.galleryImageUrls.length < 8 && (
            adding ? (
              <div className="aspect-square rounded-md border border-dashed border-[var(--interactive-default)] bg-white flex flex-col items-center justify-center p-2 gap-1">
                <Input
                  autoFocus
                  value={pendingUrl}
                  onChange={e => setPendingUrl(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') { e.preventDefault(); commitPendingUrl(); }
                    if (e.key === 'Escape') { setPendingUrl(''); setAdding(false); }
                  }}
                  onBlur={commitPendingUrl}
                  placeholder="https://…"
                  className="w-full text-[var(--app-text-micro)]"
                />
                <span className="text-[10px] text-[var(--text-disabled)]">Enter: 추가 · Esc: 취소</span>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setAdding(true)}
                className="
                  aspect-square rounded-md border border-dashed border-[var(--border-default)]
                  flex flex-col items-center justify-center gap-1
                  text-[var(--text-disabled)] hover:text-[var(--interactive-default)]
                  hover:border-[var(--interactive-default)] hover:bg-[var(--color-info-soft)]
                  transition-colors
                "
              >
                <Plus size={20} />
                <span className="text-[var(--app-text-micro)]">이미지 추가</span>
              </button>
            )
          )}
        </div>
      </div>
    </div>
  );
}

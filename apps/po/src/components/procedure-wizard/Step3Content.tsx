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

  function setGalleryUrl(idx: number, url: string) {
    const next = [...form.galleryImageUrls];
    if (url) next[idx] = url;
    else next.splice(idx, 1);
    onChange({ galleryImageUrls: next });
  }

  function addGalleryUrl() {
    if (form.galleryImageUrls.length >= 8) return;
    onChange({ galleryImageUrls: [...form.galleryImageUrls, ''] });
  }

  return (
    <div className="flex flex-col gap-5">
      <section>
        <h2 className="text-[14px] font-bold text-[var(--color-text)] mb-1">상세 콘텐츠</h2>
        <p className="text-[12px] text-[var(--color-text-dim)] mb-3">
          시술 개요, 필수 고지, 적응증을 각 언어별로 입력합니다.
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
            <label className="block text-[12px] font-semibold text-[var(--color-text-dim)] mb-1">
              적응증 (최대 5개)
            </label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {block.indications.map((ind, i) => (
                <span key={i} className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-[var(--color-bg-tertiary,#f3f4f6)] text-[11px]">
                  {ind}
                  <button
                    type="button"
                    onClick={() => removeIndication(i)}
                    className="text-[var(--color-text-dim)] hover:text-[var(--color-danger)]"
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
      </section>

      <section>
        <h2 className="text-[14px] font-bold text-[var(--color-text)] mb-1">갤러리 이미지</h2>
        <p className="text-[12px] text-[var(--color-text-dim)] mb-3">
          최대 8장. <strong>시술 전/후 비교 이미지 등록 금지</strong> — 시설·과정·의료진 이미지만.
        </p>
        <div className="flex flex-col gap-2">
          {form.galleryImageUrls.map((url, i) => (
            <div key={i} className="flex gap-2 items-start">
              <Input
                value={url}
                onChange={e => setGalleryUrl(i, e.target.value)}
                placeholder="https://…"
                className="flex-1"
              />
              <button
                type="button"
                onClick={() => setGalleryUrl(i, '')}
                className="p-2 text-[var(--color-text-dim)] hover:text-[var(--color-danger)]"
              >
                <X size={14} />
              </button>
            </div>
          ))}
          {form.galleryImageUrls.length < 8 && (
            <Button variant="secondary" size="sm" onClick={addGalleryUrl}>
              <Plus size={13} /> 이미지 URL 추가
            </Button>
          )}
        </div>
      </section>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { Input, Textarea, Button, SectionHeader } from '@hyliren/ui';
import { X, Plus, AlertTriangle } from 'lucide-react';
import type { Locale } from '@hyliren/shared';
import { LocaleTabs } from './LocaleTabs';
import { GalleryUploader } from './GalleryUploader';
import { useLocaleStore } from '@/store/locale';
import type { WizardForm } from '@/lib/wizard/types';

interface Step3Props {
  form: WizardForm;
  onChange: (patch: Partial<WizardForm>) => void;
}

export function Step3Content({ form, onChange }: Step3Props) {
  const t = useLocaleStore(s => s.t);
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

  return (
    <div className="flex flex-col gap-6">
      <div>
        <SectionHeader
          title={t('po.wizardContentTitle')}
          subtitle={t('po.wizardContentSubtitle')}
        />
        <div className="mt-3" />
        <LocaleTabs
          active={activeLocale}
          sourceLocale={form.sourceLocale}
          completed={completed}
          onChange={setActiveLocale}
        />

        <div className="flex flex-col gap-4">
          <Textarea
            label={t('po.wizardDescription')}
            value={block.description}
            onChange={e => updateBlock({ description: e.target.value })}
            rows={5}
            placeholder={t('po.wizardDescriptionPlaceholder')}
          />
          <Textarea
            label={t('po.wizardPrecautions')}
            value={block.precautions}
            onChange={e => updateBlock({ precautions: e.target.value })}
            rows={4}
            placeholder={t('po.wizardPrecautionsPlaceholder')}
          />

          <div>
            <label className="block text-[var(--text-xs)] font-semibold text-[var(--text-disabled)] mb-1">
              {t('po.wizardIndicationsLabel')}
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
                  placeholder={t('po.wizardIndicationPlaceholder')}
                  className="flex-1"
                />
                <Button variant="secondary" size="sm" onClick={addIndication}>
                  <Plus size={13} /> {t('po.wizardAdd')}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div>
        <SectionHeader
          title={t('po.wizardGalleryTitle')}
          subtitle={t('po.wizardGallerySubtitle')}
          action={
            <span className="text-[var(--app-text-micro)] text-[var(--text-subdued)]">
              {form.galleryImageUrls.length}/8
            </span>
          }
        />
        <div className="mt-2 mb-3 flex items-start gap-2 p-2.5 rounded-[var(--app-radius-sm)] bg-[var(--color-warning-soft)]">
          <AlertTriangle size={14} className="text-[var(--color-warning)] flex-shrink-0 mt-0.5" />
          <p className="text-[var(--text-xs)] text-[var(--text-default)] leading-relaxed">
            <strong className="font-semibold">{t('po.wizardGalleryWarning')}</strong>{t('po.wizardGalleryWarningDetail')}
          </p>
        </div>

        <GalleryUploader
          urls={form.galleryImageUrls}
          onChange={urls => onChange({ galleryImageUrls: urls })}
          max={8}
          addLabel={t('po.wizardImageAdd')}
        />
      </div>
    </div>
  );
}

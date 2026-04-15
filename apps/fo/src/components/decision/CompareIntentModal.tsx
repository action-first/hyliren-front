'use client';

import { Button } from '@hyliren/ui';
import { X, AlertTriangle } from 'lucide-react';
import { track } from '@hyliren/shared';
import { useLocaleStore } from '@/store/locale';

interface Props {
  /** 비교 대상 제안서 가격들 — 구체적 불안 시각화용 */
  prices: number[];
  hospitalNames: string[];
  onClose: () => void;
  onProceedToReport: () => void;
}

export function CompareIntentModal({ prices, hospitalNames, onClose, onProceedToReport }: Props) {
  const t = useLocaleStore(s => s.t);
  if (prices.length === 0) { onClose(); return null; }

  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const diff = maxPrice - minPrice;

  function handleProceed() {
    track({ eventType: 'report_clicked', actorType: 'user', metadata: { source: 'fo', locale: 'ko', label: 'compare_intent_modal' } });
    onClose();
    onProceedToReport();
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/30 z-50" onClick={onClose} />
      <div className="fixed bottom-0 inset-x-0 mx-auto w-full max-w-[var(--fo-frame-max-width)] z-50 rounded-t-3xl overflow-hidden animate-[slideUp_0.3s_ease-out]">
        <div className="bg-white px-6 pt-5 pb-8"
          style={{ boxShadow: '0 -4px 24px rgba(0,0,0,0.12)' }}>

          {/* Handle + close */}
          <div className="relative mb-5">
            <div className="w-10 h-1 rounded-full bg-[var(--color-border-light)] mx-auto" />
            <button onClick={onClose} type="button"
              className="absolute right-0 top-0 w-8 h-8 rounded-full bg-[var(--color-bg-secondary)] flex items-center justify-center border-0 cursor-pointer">
              <X size={16} className="text-[var(--color-text-dim)]" />
            </button>
          </div>

          {/* Concrete anxiety — 숫자로 불안 시각화 */}
          <div className="flex items-start gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center shrink-0">
              <AlertTriangle size={20} className="text-amber-500" />
            </div>
            <div>
              <h2 className="text-[1.25rem] font-bold text-[var(--color-text)] leading-tight mb-1">
                {diff > 0 ? t('compare.priceDiff', { diff }) : t('compare.priceSimilar')}<br />
                {t('compare.whyDifferent')}
              </h2>
              <p className="text-[13px] text-[var(--color-text-dim)] leading-relaxed">
                {t('compare.priceReason')}
              </p>
            </div>
          </div>

          {/* Price comparison — concrete */}
          <div className="rounded-xl bg-[var(--color-bg-secondary)] px-4 py-3.5 mb-5">
            {hospitalNames.map((name, i) => (
              <div key={name} className={`flex items-center justify-between py-2 ${i > 0 ? 'border-t border-[var(--color-border-light)]' : ''}`}>
                <span className="text-[13px] text-[var(--color-text)]">{name}</span>
                <span className={`text-[15px] font-bold ${prices[i] === minPrice ? 'text-emerald-600' : prices[i] === maxPrice ? 'text-amber-600' : 'text-[var(--color-text)]'}`}>
                  {prices[i]}{t('common.currency')}
                </span>
              </div>
            ))}
          </div>

          {/* What you'll know */}
          <div className="flex flex-col gap-2 mb-6">
            <p className="text-[12px] text-[var(--color-text-secondary)] leading-relaxed">
              · {t('compare.benefit1')}
            </p>
            <p className="text-[12px] text-[var(--color-text-secondary)] leading-relaxed">
              · {t('compare.benefit2')}
            </p>
            <p className="text-[12px] text-[var(--color-text-secondary)] leading-relaxed">
              · {t('compare.benefit3')}
            </p>
          </div>

          {/* CTA */}
          <Button variant="accent" size="lg" fullWidth onClick={handleProceed}>
            {t('compare.cta')}
          </Button>
          <p className="text-center text-[10px] text-[var(--color-text-dim)] mt-2">
            {t('compare.social')}
          </p>
        </div>
      </div>
    </>
  );
}

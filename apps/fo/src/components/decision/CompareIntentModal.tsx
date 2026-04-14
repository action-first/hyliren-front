'use client';

import { Button } from '@hyliren/ui';
import { X, Scale, TrendingDown, ShieldCheck, AlertTriangle } from 'lucide-react';
import { track } from '@hyliren/shared';

interface Props {
  onClose: () => void;
  onProceedToReport: () => void;
}

export function CompareIntentModal({ onClose, onProceedToReport }: Props) {
  function handleProceed() {
    track({ eventType: 'report_clicked', actorType: 'user', metadata: { source: 'fo', locale: 'ko', label: 'compare_intent_modal' } });
    onClose();
    onProceedToReport();
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/30 z-50" onClick={onClose} />
      <div className="fixed bottom-0 inset-x-0 mx-auto w-full max-w-[var(--fo-frame-max-width)] z-50 rounded-t-3xl overflow-hidden animate-[slideUp_0.3s_ease-out]">
        <div className="bg-white rounded-t-3xl px-6 pt-5 pb-8"
          style={{ boxShadow: '0 -4px 24px rgba(0,0,0,0.12)' }}>

          {/* Handle + close */}
          <div className="relative mb-4">
            <div className="w-10 h-1 rounded-full bg-[var(--color-border-light)] mx-auto" />
            <button onClick={onClose} type="button"
              className="absolute right-0 top-0 w-8 h-8 rounded-full bg-[var(--color-bg-secondary)] flex items-center justify-center border-0 cursor-pointer">
              <X size={16} className="text-[var(--color-text-dim)]" />
            </button>
          </div>

          {/* Icon */}
          <div className="w-12 h-12 rounded-full bg-[var(--color-bg-secondary)] flex items-center justify-center mb-4">
            <Scale size={22} className="text-[var(--color-text-dim)]" />
          </div>

          {/* Headline */}
          <h2 className="text-[1.25rem] font-bold text-[var(--color-text)] leading-tight mb-2">
            비교하려면 기준이 필요합니다
          </h2>
          <p className="text-[13px] text-[var(--color-text-dim)] leading-relaxed mb-5">
            제안서를 비교하려면 가격, 리스크, 과잉진료 여부를<br />
            먼저 확인해야 합니다
          </p>

          {/* What you get */}
          <div className="flex flex-col gap-2 mb-6">
            {[
              { icon: TrendingDown, text: '가격이 시장 평균 대비 적정한지 확인' },
              { icon: AlertTriangle, text: '불필요한 시술이 포함되어 있지 않은지 검증' },
              { icon: ShieldCheck, text: '비교 시 어떤 제안이 합리적인지 기준 제공' },
            ].map(item => {
              const Icon = item.icon;
              return (
                <div key={item.text} className="flex items-start gap-2.5 px-3 py-2.5 rounded-xl bg-[var(--color-bg-secondary)]">
                  <Icon size={15} className="text-[var(--color-primary)] shrink-0 mt-0.5" />
                  <span className="text-[12px] text-[var(--color-text)] leading-relaxed">{item.text}</span>
                </div>
              );
            })}
          </div>

          {/* CTA */}
          <Button variant="accent" size="lg" fullWidth onClick={handleProceed}>
            리포트로 비교 기준 만들기
          </Button>
          <p className="text-center text-[10px] text-[var(--color-text-dim)] mt-2">
            비교 기준 없이 선택하는 것은 위험합니다
          </p>
        </div>
      </div>
    </>
  );
}

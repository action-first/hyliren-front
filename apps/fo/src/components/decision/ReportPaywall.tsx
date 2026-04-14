'use client';

import { Button } from '@hyliren/ui';
import { X, ShieldCheck, TrendingDown, AlertTriangle } from 'lucide-react';
import { useReportStore } from '@/store/report';
import { track } from '@hyliren/shared';

export function ReportPaywall() {
  const { isPaywallOpen, closePaywall, activeProposalId, markPurchased } = useReportStore();

  if (!isPaywallOpen || !activeProposalId) return null;

  function handlePurchase() {
    track({ eventType: 'report_purchased', actorType: 'user', targetType: 'proposal', targetId: activeProposalId!,
      metadata: { source: 'fo', locale: 'ko', value: '4900' } });
    markPurchased(activeProposalId!);
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-[60]" onClick={closePaywall} />
      <div className="fixed bottom-0 inset-x-0 mx-auto w-full max-w-[var(--fo-frame-max-width)] z-[60] animate-[slideUp_0.3s_ease-out]">
        <div className="bg-white rounded-t-3xl px-6 pt-5 pb-8">
          {/* Handle + close */}
          <div className="relative mb-4">
            <div className="w-10 h-1 rounded-full bg-[var(--color-border-light)] mx-auto" />
            <button onClick={closePaywall}
              className="absolute right-0 top-0 w-8 h-8 rounded-full bg-[var(--color-bg-secondary)] flex items-center justify-center border-0 cursor-pointer">
              <X size={16} className="text-[var(--color-text-dim)]" />
            </button>
          </div>

          {/* Headline */}
          <h2 className="text-[1.375rem] font-bold text-[var(--color-text)] leading-tight mb-2">
            이 선택,<br />정말 괜찮을까요?
          </h2>

          {/* Risk copy */}
          <div className="flex flex-col gap-2 mb-5">
            {[
              { icon: TrendingDown, text: '같은 시술인데 가격 차이가 크다면, 이유가 있습니다' },
              { icon: AlertTriangle, text: '불필요한 시술이 포함되어 있을 수 있습니다' },
              { icon: ShieldCheck, text: '한국 의료 데이터 기반으로 객관적으로 검증합니다' },
            ].map(item => {
              const Icon = item.icon;
              return (
                <div key={item.text} className="flex items-start gap-2.5 px-3 py-2.5 rounded-xl bg-[var(--color-bg-secondary)]">
                  <Icon size={16} className="text-[var(--color-primary)] shrink-0 mt-0.5" />
                  <span className="text-[12px] text-[var(--color-text)] leading-relaxed">{item.text}</span>
                </div>
              );
            })}
          </div>

          {/* Price */}
          <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-gradient-to-r from-[var(--color-primary-soft)] to-[#fff5f7] mb-5">
            <span className="text-[13px] font-medium text-[var(--color-text)]">검증 리포트</span>
            <div className="flex items-baseline gap-1">
              <span className="text-[11px] text-[var(--color-text-dim)] line-through">₩9,900</span>
              <span className="text-[1.125rem] font-bold text-[var(--color-primary)]">₩4,900</span>
            </div>
          </div>

          {/* CTA */}
          <Button variant="accent" size="lg" fullWidth onClick={handlePurchase}>
            리포트 확인하기
          </Button>
          <p className="text-center text-[10px] text-[var(--color-text-dim)] mt-2">
            정확한 적용 여부는 실제 병원 상담을 통해 결정됩니다
          </p>
        </div>
      </div>
    </>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { Button } from '@hyliren/ui';
import { ShieldCheck, TrendingDown, AlertTriangle, X } from 'lucide-react';
import { track } from '@hyliren/shared';
import { useReportStore } from '@/store/report';

interface Props {
  concernId: string;
  proposalId: string;
  /** Delay before auto-show (ms) */
  delay?: number;
}

export function ReportNudgeSheet({ concernId, proposalId, delay = 5000 }: Props) {
  const { markPurchased } = useReportStore();
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (dismissed) return;
    const timer = setTimeout(() => {
      setVisible(true);
      track({ eventType: 'report_nudge_viewed', actorType: 'user', targetType: 'concern', targetId: concernId, metadata: { source: 'fo', locale: 'ko' } });
    }, delay);
    return () => clearTimeout(timer);
  }, [concernId, delay, dismissed]);

  function handleDismiss() {
    setVisible(false);
    setDismissed(true);
  }

  function handleClick() {
    track({ eventType: 'report_clicked', actorType: 'user', targetType: 'concern', targetId: concernId, metadata: { source: 'fo', locale: 'ko', label: 'nudge_sheet' } });
    track({ eventType: 'report_purchased', actorType: 'user', targetType: 'proposal', targetId: proposalId,
      metadata: { source: 'fo', locale: 'ko', value: '4900', label: 'nudge' } });
    markPurchased(proposalId);
    handleDismiss();
  }

  if (!visible) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/30 z-50 transition-opacity"
        onClick={handleDismiss}
      />

      {/* Sheet */}
      <div className="fixed bottom-0 inset-x-0 mx-auto w-full max-w-[var(--fo-frame-max-width)] z-50 rounded-t-3xl overflow-hidden animate-[slideUp_0.3s_ease-out]">
        <div className="bg-white rounded-t-3xl px-6 pt-5 pb-8"
          style={{ boxShadow: '0 -4px 24px rgba(0,0,0,0.12)' }}>

          {/* Handle + dismiss */}
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-1 rounded-full bg-[var(--color-border-light)] mx-auto" />
            <button onClick={handleDismiss}
              className="absolute right-6 top-5 w-8 h-8 rounded-full bg-[var(--color-bg-secondary)] flex items-center justify-center border-0 cursor-pointer">
              <X size={16} className="text-[var(--color-text-dim)]" />
            </button>
          </div>

          {/* Title */}
          <h2 className="text-[1.25rem] font-bold text-[var(--color-text)] leading-tight mb-1.5">
            이 선택, 괜찮을까요?
          </h2>
          <p className="text-[13px] text-[var(--color-text-dim)] leading-relaxed mb-5">
            가격 · 과잉진료 · 리스크를<br />
            전문 기준으로 검증해드립니다
          </p>

          {/* Preview list */}
          <div className="flex flex-col gap-2.5 mb-6">
            {[
              { icon: TrendingDown, label: '가격 적정성 분석', desc: '제안 가격이 시장 평균 대비 적정한지 확인' },
              { icon: ShieldCheck, label: '과잉 진료 여부', desc: '불필요한 시술이 포함되어 있지 않은지 검증' },
              { icon: AlertTriangle, label: '리스크 평가', desc: '시술별 부작용 가능성과 회복 기간 분석' },
            ].map(item => {
              const Icon = item.icon;
              return (
                <div key={item.label} className="flex items-start gap-3 px-4 py-3 rounded-xl bg-[var(--color-bg-secondary)]">
                  <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shrink-0 mt-0.5">
                    <Icon size={16} className="text-[var(--color-primary)]" />
                  </div>
                  <div>
                    <span className="text-[13px] font-semibold text-[var(--color-text)] block">{item.label}</span>
                    <span className="text-[11px] text-[var(--color-text-dim)]">{item.desc}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* CTA */}
          <Button variant="accent" size="lg" fullWidth onClick={handleClick}>
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

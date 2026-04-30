'use client';

import { useState, useEffect } from 'react';
import { Button, BottomSheet } from '@hyliren/ui';
import { ShieldCheck, TrendingDown, AlertTriangle } from 'lucide-react';
import { track } from '@hyliren/shared';
import { useReportStore } from '@/store/report';
import { useLocaleStore } from '@/store/locale';

interface Props {
  concernId: string;
  proposalId: string;
  /** Delay before auto-show (ms) */
  delay?: number;
}

export function ReportNudgeSheet({ concernId, proposalId, delay = 5000 }: Props) {
  const t = useLocaleStore(s => s.t);
  const { markPurchased, isPurchased } = useReportStore();
  const alreadyPurchased = isPurchased(proposalId);
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (dismissed || alreadyPurchased) return;
    const timer = setTimeout(() => {
      setVisible(true);
      track({ eventType: 'report_nudge_viewed', actorType: 'user', targetType: 'concern', targetId: concernId, metadata: { source: 'fo' } });
    }, delay);
    return () => clearTimeout(timer);
  }, [concernId, delay, dismissed]);

  function handleDismiss() {
    setVisible(false);
    setDismissed(true);
  }

  function handleClick() {
    track({ eventType: 'report_clicked', actorType: 'user', targetType: 'concern', targetId: concernId, metadata: { source: 'fo', label: 'nudge_sheet' } });
    track({ eventType: 'report_purchased', actorType: 'user', targetType: 'proposal', targetId: proposalId,
      metadata: { source: 'fo', value: '4900', label: 'nudge' } });
    markPurchased(proposalId);
    handleDismiss();
  }

  if (!visible || alreadyPurchased) return null;

  return (
    <BottomSheet open={visible} onClose={handleDismiss} showHandle showClose>
          {/* Title */}
          <h2 className="text-[1.25rem] font-bold text-[var(--color-text)] leading-tight mb-1.5">
            {t('nudge.title')}
          </h2>
          <p className="text-[13px] text-[var(--color-text-dim)] leading-relaxed whitespace-pre-line mb-5">
            {t('nudge.desc')}
          </p>

          {/* Preview list */}
          <div className="flex flex-col gap-2.5 mb-6">
            {[
              { icon: TrendingDown, label: t('nudge.benefit1Title'), desc: t('nudge.benefit1Desc') },
              { icon: ShieldCheck, label: t('nudge.benefit2Title'), desc: t('nudge.benefit2Desc') },
              { icon: AlertTriangle, label: t('nudge.benefit3Title'), desc: t('nudge.benefit3Desc') },
            ].map(item => {
              const Icon = item.icon;
              return (
                <div key={item.label} className="flex items-start gap-3 px-4 py-3 rounded-[var(--app-radius)] bg-[var(--color-bg-secondary)]">
                  <div className="w-8 h-8 rounded-full bg-[var(--color-bg)] flex items-center justify-center shrink-0 mt-0.5">
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
          <Button variant="primary" size="xl" fullWidth onClick={handleClick}>
            {t('nudge.cta')}
          </Button>
          <p className="text-center text-[10px] text-[var(--color-text-dim)] mt-2">
            {t('nudge.social')}
          </p>
    </BottomSheet>
  );
}

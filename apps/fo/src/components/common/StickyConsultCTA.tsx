'use client';

import Link from 'next/link';
import { Button } from '@hyliren/ui';
import { ArrowRight, Clock } from 'lucide-react';
import { useLocaleStore } from '@/store/locale';

type UserPhase = 'idle' | 'waiting' | 'proposals_ready';

interface StickyConsultCTAProps {
  phase: UserPhase;
}

export function StickyConsultCTA({ phase }: StickyConsultCTAProps) {
  const t = useLocaleStore(s => s.t);
  // proposals_ready → 알림은 헤더 뱃지로 처리, sticky CTA 불필요
  if (phase === 'proposals_ready') return null;

  if (phase === 'waiting') {
    return (
      <div className="fixed bottom-[calc(var(--fo-bottom-bar-height)+var(--fo-safe-area-bottom))] inset-x-0 mx-auto w-full max-w-[var(--fo-frame-max-width)] z-30 px-5 pb-2 pt-3 bg-gradient-to-t from-white via-white/95 to-white/0">
        <Link href="/dashboard" className="no-underline block">
          <div className="flex items-center gap-3 px-5 py-3.5 rounded-2xl bg-[var(--color-bg-secondary)]"
            style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
            <Clock size={20} className="text-[var(--color-primary)] shrink-0" />
            <div className="flex-1">
              <span className="text-[13px] font-semibold text-[var(--color-text)]">{t('sticky.preparing')}</span>
              <span className="text-[11px] text-[var(--color-text-dim)] block">{t('sticky.checkConsult')}</span>
            </div>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--color-text-dim)]">
              <path d="m9 18 6-6-6-6" />
            </svg>
          </div>
        </Link>
      </div>
    );
  }

  // idle — 상담 시작 CTA
  return (
    <div className="fixed bottom-[calc(var(--fo-bottom-bar-height)+var(--fo-safe-area-bottom))] inset-x-0 mx-auto w-full max-w-[var(--fo-frame-max-width)] z-30 px-5 pb-2 pt-3 bg-gradient-to-t from-white via-white/95 to-white/0">
      <Link href="/consult" className="no-underline block">
        <Button variant="accent" size="lg" fullWidth>
          {t('sticky.tellConcern')}
          <ArrowRight size={18} />
        </Button>
      </Link>
    </div>
  );
}

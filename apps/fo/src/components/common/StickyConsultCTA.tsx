'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@hyliren/ui';
import { ArrowRight, Clock, X, Sparkles, ChevronRight } from 'lucide-react';
import { useLocaleStore } from '@/store/locale';

type UserPhase = 'idle' | 'waiting' | 'proposals_ready';

interface StickyConsultCTAProps {
  phase: UserPhase;
  unreadCount?: number;
}

export function StickyConsultCTA({ phase, unreadCount = 0 }: StickyConsultCTAProps) {
  const t = useLocaleStore(s => s.t);
  const [dismissed, setDismissed] = useState(false);

  /* ═══ proposals_ready — 바텀 시트 (첫 노출) ═══ */
  if (phase === 'proposals_ready' && !dismissed) {
    return (
      <>
        <div className="fixed inset-0 bg-black/20 z-40" onClick={() => setDismissed(true)} />
        <div className="fixed bottom-0 inset-x-0 mx-auto w-full max-w-[var(--fo-frame-max-width)] z-50 rounded-t-3xl overflow-hidden animate-[slideUp_0.3s_ease-out]">
          <div className="bg-white px-6 pt-5 pb-8"
            style={{ boxShadow: '0 -4px 24px rgba(0,0,0,0.12)' }}>

            {/* Handle + close */}
            <div className="relative mb-6">
              <div className="w-10 h-1 rounded-full bg-[var(--color-border-light)] mx-auto" />
              <button type="button" onClick={() => setDismissed(true)}
                className="absolute right-0 top-0 w-8 h-8 rounded-full bg-[var(--color-bg-secondary)] flex items-center justify-center border-0 cursor-pointer">
                <X size={16} className="text-[var(--color-text-dim)]" />
              </button>
            </div>

            {/* 3D Icon — 제안서 도착 시각화 */}
            <div className="flex justify-center mb-2">
              <img
                src="/images/proposal-arrived.jpg"
                alt=""
                className="w-40 h-40 object-contain"
              />
            </div>

            {/* Text */}
            <div className="text-center mb-6">
              <h3 className="text-[1.25rem] font-bold text-[var(--color-text)] leading-tight mb-2">
                {t('sticky.proposalsArrived')}
              </h3>
              <p className="text-[13px] text-[var(--color-text-dim)]">
                {unreadCount > 0
                  ? `${unreadCount}개 병원이 맞춤 제안을 보냈어요`
                  : '병원의 맞춤 제안을 확인하세요'}
              </p>
            </div>

            {/* CTA */}
            <Link href="/decision" className="no-underline block">
              <Button variant="accent" size="lg" fullWidth>
                {t('sticky.checkProposals')}
                <ArrowRight size={18} />
              </Button>
            </Link>
          </div>
        </div>
      </>
    );
  }

  /* proposals_ready + dismissed → Hero CTA가 역할 대신하므로 sticky 없음 */
  if (phase === 'proposals_ready' && dismissed) {
    return null;
  }

  /* ═══ waiting ═══ */
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
            <ChevronRight size={16} className="text-[var(--color-text-dim)]" />
          </div>
        </Link>
      </div>
    );
  }

  /* ═══ idle — 상담 시작 CTA ═══ */
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

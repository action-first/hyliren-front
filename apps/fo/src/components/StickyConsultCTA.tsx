'use client';

import Link from 'next/link';
import { Button } from '@hyliren/ui';
import { ArrowRight, Bell, Clock } from 'lucide-react';

type UserPhase = 'idle' | 'waiting' | 'proposals_ready';

interface StickyConsultCTAProps {
  phase: UserPhase;
  proposalCount?: number;
}

export function StickyConsultCTA({ phase, proposalCount = 0 }: StickyConsultCTAProps) {
  if (phase === 'idle') {
    return (
      <div className="fixed bottom-[calc(var(--fo-bottom-bar-height)+var(--fo-safe-area-bottom))] left-1/2 -translate-x-1/2 w-full max-w-[var(--fo-frame-max-width)] z-30 px-5 pb-2 pt-3 bg-gradient-to-t from-white via-white/95 to-white/0">
        <Link href="/consult" className="no-underline block">
          <Button variant="accent" size="lg" fullWidth>
            무료 고민 상담 시작하기
            <ArrowRight size={18} />
          </Button>
        </Link>
        <p className="text-center text-[10.5px] text-[var(--color-text-dim)] mt-1.5">
          사진 3장 + 고민만 입력하면 됩니다
        </p>
      </div>
    );
  }

  if (phase === 'waiting') {
    return (
      <div className="fixed bottom-[calc(var(--fo-bottom-bar-height)+var(--fo-safe-area-bottom))] left-1/2 -translate-x-1/2 w-full max-w-[var(--fo-frame-max-width)] z-30 px-5 pb-2 pt-3 bg-gradient-to-t from-white via-white/95 to-white/0">
        <Link href="/dashboard" className="no-underline block">
          <div className="flex items-center gap-3 px-5 py-3.5 rounded-2xl bg-[var(--color-bg-secondary)]"
            style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
            <Clock size={20} className="text-[var(--color-primary)] shrink-0" />
            <div className="flex-1">
              <span className="text-[13px] font-semibold text-[var(--color-text)]">제안이 준비되고 있어요</span>
              <span className="text-[11px] text-[var(--color-text-dim)] block">기다리는 동안 관련 정보 보기</span>
            </div>
            <ChevronIcon />
          </div>
        </Link>
      </div>
    );
  }

  // proposals_ready
  return (
    <div className="fixed bottom-[calc(var(--fo-bottom-bar-height)+var(--fo-safe-area-bottom))] left-1/2 -translate-x-1/2 w-full max-w-[var(--fo-frame-max-width)] z-30 px-5 pb-2 pt-3 bg-gradient-to-t from-white via-white/95 to-white/0">
      <Link href="/proposals" className="no-underline block">
        <Button variant="accent" size="lg" fullWidth>
          <Bell size={16} />
          새로운 제안 {proposalCount}개 도착
          <ArrowRight size={18} />
        </Button>
      </Link>
      <p className="text-center text-[10.5px] text-[var(--color-text-dim)] mt-1.5">
        지금 확인하기
      </p>
    </div>
  );
}

function ChevronIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--color-text-dim)]">
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}

'use client';

import Link from 'next/link';
import { Button } from '@hyliren/ui';
import { ArrowRight, Sparkles } from 'lucide-react';
import { useDecisionStore } from '@/store/decision';
import { track } from '@hyliren/shared';

interface Props {
  /** First concern ID for compare navigation */
  primaryConcernId: string;
}

export function StickyBottomBar({ primaryConcernId }: Props) {
  const { selectedProposalIds } = useDecisionStore();
  const count = selectedProposalIds.size;

  if (count === 0) return null;

  return (
    <div className="fixed bottom-[calc(var(--fo-bottom-bar-height)+var(--fo-safe-area-bottom))] inset-x-0 mx-auto w-full max-w-[var(--fo-frame-max-width)] z-30 px-5 pb-2 pt-3 bg-gradient-to-t from-white via-white/95 to-white/0">
      {count >= 2 ? (
        <Link href={`/concerns/${primaryConcernId}/compare`} className="no-underline block"
          onClick={() => track({ eventType: 'compare_started', actorType: 'user', metadata: { source: 'fo', locale: 'ko', value: String(count) } })}>
          <Button variant="accent" size="lg" fullWidth>
            {count}개 비교하기
            <ArrowRight size={18} />
          </Button>
        </Link>
      ) : (
        <div className="flex items-center gap-3">
          <div className="flex-1 text-[13px] text-[var(--color-text-secondary)]">
            <span className="font-semibold text-[var(--color-primary)]">{count}개</span> 선택됨 — 1개 더 선택하면 비교 가능
          </div>
          <Link href={`/concerns/${primaryConcernId}/compare`} className="no-underline shrink-0">
            <Button variant="secondary" size="md">
              <Sparkles size={14} />
              리포트 보기
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}

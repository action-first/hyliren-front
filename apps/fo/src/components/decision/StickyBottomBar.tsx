'use client';

import { Button } from '@hyliren/ui';
import { Scale } from 'lucide-react';
import { useDecisionStore } from '@/store/decision';
import { track } from '@hyliren/shared';

interface Props {
  onCompareClick: () => void;
}

export function StickyBottomBar({ onCompareClick }: Props) {
  const { selectedProposalIds } = useDecisionStore();
  const count = selectedProposalIds.size;

  if (count === 0) return null;

  return (
    <div className="fixed bottom-[calc(var(--fo-bottom-bar-height)+var(--fo-safe-area-bottom))] inset-x-0 mx-auto w-full max-w-[var(--fo-frame-max-width)] z-30 px-5 pb-2 pt-3 bg-gradient-to-t from-white via-white/95 to-white/0">
      {count >= 2 ? (
        <Button variant="accent" size="lg" fullWidth
          onClick={() => {
            track({ eventType: 'compare_intent_clicked', actorType: 'user', metadata: { source: 'fo', locale: 'ko', value: String(count) } });
            onCompareClick();
          }}>
          <Scale size={16} />
          {count}개 비교하기
        </Button>
      ) : (
        <div className="flex items-center gap-3">
          <div className="flex-1 text-[13px] text-[var(--color-text-secondary)]">
            <span className="font-semibold text-[var(--color-primary)]">{count}개</span> 선택됨 — 1개 더 선택하면 비교 가능
          </div>
          <span className="text-[12px] text-[var(--color-text-dim)] shrink-0">탭해서 분석하기</span>
        </div>
      )}
    </div>
  );
}

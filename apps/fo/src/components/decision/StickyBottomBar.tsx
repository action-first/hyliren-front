'use client';

import { Button } from '@hyliren/ui';
import { Scale } from 'lucide-react';
import { useDecisionStore } from '@/store/decision';
import { useLocaleStore } from '@/store/locale';
import { track } from '@hyliren/shared';

interface Props {
  onCompareClick: () => void;
  onAnalyzeClick?: (proposalId: string) => void;
}

export function StickyBottomBar({ onCompareClick, onAnalyzeClick }: Props) {
  const t = useLocaleStore(s => s.t);
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
          {t('decision.compareCount', { count })}
        </Button>
      ) : (
        <div className="flex gap-2">
          <div className="flex-1 flex items-center text-[13px] text-[var(--color-text-secondary)]">
            {t('decision.selectedCount', { count })}
          </div>
          <Button variant="primary" size="md"
            onClick={() => {
              const id = Array.from(selectedProposalIds)[0];
              if (id && onAnalyzeClick) {
                track({ eventType: 'single_analyze_clicked', actorType: 'user', metadata: { source: 'fo', locale: 'ko' } });
                onAnalyzeClick(id);
              }
            }}>
            {t('decision.verifyThis')}
          </Button>
        </div>
      )}
    </div>
  );
}

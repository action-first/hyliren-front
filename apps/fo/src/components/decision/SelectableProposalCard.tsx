'use client';

import { formatKRW } from '@hyliren/shared';
import { ShieldCheck, Star, Check, Clock, Syringe } from 'lucide-react';
import { useLocaleStore } from '@/store/locale';

interface Props {
  hospitalName: string;
  verified: boolean;
  valueProp: string;
  price: number;
  meta: string;
  coverTags: string[];
  quote: string | null;
  gradientIndex: number;
  selected: boolean;
  onToggle: () => void;
  onCardClick?: () => void;
  rating?: number;
  unread?: boolean;
}

export function SelectableProposalCard({
  hospitalName, verified, valueProp, price, meta,
  coverTags, quote, selected, onToggle, onCardClick, rating = 4.8, unread = false,
}: Props) {
  const t = useLocaleStore(s => s.t);
  return (
    <button
      onClick={() => onCardClick ? onCardClick() : onToggle()}
      className={`w-full text-left rounded-[var(--app-radius)] bg-[var(--color-bg)] transition-all duration-150 cursor-pointer border-0 p-0 ${
        selected ? 'ring-2 ring-[var(--color-primary)] ring-offset-1' : ''
      }`}
      style={{ boxShadow: 'var(--app-shadow-card-sm)' }}
    >
      <div className="flex items-start gap-3 px-4 py-3.5">
        {/* 선택 체크 — 44px 터치 영역 */}
        <div
          onClick={(e) => { e.stopPropagation(); onToggle(); }}
          className="mt-0.5 w-11 h-11 -m-2 flex items-center justify-center shrink-0 cursor-pointer"
        >
          <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${
            selected
              ? 'bg-[var(--color-primary)] text-white'
              : 'border-2 border-[var(--color-border-light)]'
          }`}>
            {selected && <Check size={13} strokeWidth={3} />}
          </div>
        </div>

        {/* 내용 */}
        <div className="flex-1 min-w-0">
          {/* 1행: 병원명 + 배지 */}
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className={`text-[14px] text-[var(--color-text)] truncate ${unread ? 'font-bold' : 'font-semibold'}`}>
              {hospitalName}
            </span>
            {verified && (
              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-[var(--color-success-soft)] text-[9px] font-semibold text-[var(--color-success)] shrink-0">
                <ShieldCheck size={9} /> {t('common.verified')}
              </span>
            )}
            {unread && (
              <span className="px-1.5 py-0.5 rounded bg-[var(--color-primary)] text-[8px] font-bold text-white shrink-0">
                NEW
              </span>
            )}
            <div className="flex items-center gap-0.5 text-[10px] text-[var(--color-text-dim)] ml-auto shrink-0">
              <Star size={9} fill="currentColor" /> {rating}
            </div>
          </div>

          {/* 2행: 특장점 */}
          {valueProp && (
            <p className="text-[11px] text-[var(--color-text-secondary)] line-clamp-1 mb-1.5">{valueProp}</p>
          )}

          {/* 3행: 가격 */}
          <span className="text-[17px] font-bold text-[var(--color-text)] block mb-1">{formatKRW(price)}</span>

          {/* 4행: 메타 (회복·마취) */}
          <div className="flex items-center gap-1 text-[11px] text-[var(--color-text-dim)] mb-2">
            <Clock size={10} className="shrink-0" />
            <span>{meta}</span>
          </div>

          {/* 5행: 시술 태그 */}
          {coverTags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-1.5">
              {coverTags.map(tag => (
                <span key={tag} className="px-2 py-0.5 rounded-full border border-[var(--color-border-light)] text-[10px] font-medium text-[var(--color-text-secondary)]">
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* 6행: 한줄 코멘트 */}
          {quote && (
            <p className="text-[11px] text-[var(--color-text-secondary)] line-clamp-1">&ldquo;{quote}&rdquo;</p>
          )}
        </div>
      </div>
    </button>
  );
}

'use client';

import { ShieldCheck, Star, Check } from 'lucide-react';
import { CARD_GRADIENTS, VALUE_PROPS } from '@/lib/constants';

interface Props {
  proposalId: string;
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
}

export function SelectableProposalCard({
  hospitalName, verified, valueProp, price, meta,
  coverTags, quote, gradientIndex, selected, onToggle, onCardClick,
}: Props) {
  const gradient = CARD_GRADIENTS[gradientIndex % CARD_GRADIENTS.length];

  return (
    <button
      onClick={() => onCardClick ? onCardClick() : onToggle()}
      className={`w-full text-left rounded-[20px] overflow-hidden bg-white transition-all duration-200 cursor-pointer border-0 p-0 ${
        selected
          ? 'ring-2 ring-[var(--color-primary)] ring-offset-2 scale-[1.0]'
          : 'scale-[0.98] hover:scale-[1.0]'
      }`}
      style={{ boxShadow: selected ? '0 4px 16px rgba(255,56,92,0.12)' : '0 1px 3px rgba(0,0,0,0.08)' }}
    >
      {/* Cover */}
      <div className={`relative h-36 overflow-hidden bg-gradient-to-br ${gradient}`}>
        <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-black/12 to-transparent" />

        {/* Select indicator — stops propagation to toggle without opening detail */}
        <div
          onClick={(e) => { e.stopPropagation(); onToggle(); }}
          className={`absolute top-3 right-3 w-7 h-7 rounded-full flex items-center justify-center transition-all cursor-pointer ${
            selected
              ? 'bg-[var(--color-primary)] text-white'
              : 'bg-white/70 backdrop-blur-sm border-2 border-white/50'
          }`}>
          {selected && <Check size={14} strokeWidth={3} />}
        </div>

        {/* Verified */}
        {verified && (
          <span className="absolute top-3 left-3 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/90 backdrop-blur-sm text-[10px] font-semibold text-emerald-600">
            <ShieldCheck size={10} /> 인증
          </span>
        )}

        {/* Tags */}
        {coverTags.length > 0 && (
          <div className="absolute bottom-2.5 left-3 flex gap-1">
            {coverTags.map(tag => (
              <span key={tag} className="px-2 py-0.5 rounded-full bg-white/90 backdrop-blur-sm text-[10px] font-semibold text-[var(--color-text)]">
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="px-3.5 pt-2.5 pb-3">
        <p className="text-[14px] font-medium text-[var(--color-text)] leading-snug mb-0.5 line-clamp-1">{valueProp}</p>
        <div className="flex items-baseline gap-1.5 mb-1">
          <span className="text-[15px] font-bold text-[var(--color-text)]">{price}만원</span>
          <span className="text-[10px] text-[var(--color-text-dim)]">· {meta}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-[var(--color-text-secondary)]">{hospitalName}</span>
          <div className="flex items-center gap-0.5 text-[10px] text-[var(--color-text-dim)]">
            <Star size={9} fill="currentColor" /> 4.8
          </div>
        </div>
        {quote && (
          <p className="text-[10px] text-[var(--color-text-dim)] italic mt-1 line-clamp-1">&ldquo;{quote}&rdquo;</p>
        )}
      </div>
    </button>
  );
}

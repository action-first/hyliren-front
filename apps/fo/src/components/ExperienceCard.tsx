'use client';

import type { ReactNode } from 'react';
import { ShieldCheck, Star, Heart, Check } from 'lucide-react';

interface ExperienceCardProps {
  /** Cover area — gradient class string or image URL */
  gradient: string;
  /** Value proposition — the main selling point */
  valueProp: string;
  /** Hospital name */
  hospitalName: string;
  /** Whether the hospital is verified */
  verified?: boolean;
  /** Rating score */
  rating?: number;
  /** Price in 만원 */
  price: number;
  /** Meta line (recovery, anesthesia, etc.) */
  meta?: string;
  /** Tags shown on the cover image */
  coverTags?: string[];
  /** Selection state */
  selected?: boolean;
  /** Called when selection toggle is clicked */
  onToggleSelect?: () => void;
  /** Consultation note quote */
  quote?: string | null;
  /** Extra content below meta */
  children?: ReactNode;
}

export function ExperienceCard({
  gradient,
  valueProp,
  hospitalName,
  verified = false,
  rating,
  price,
  meta,
  coverTags,
  selected,
  onToggleSelect,
  quote,
  children,
}: ExperienceCardProps) {
  return (
    <div className={`rounded-[20px] overflow-hidden bg-white transition-all duration-200 ${
      selected !== undefined && selected
        ? 'ring-2 ring-[var(--color-primary)] ring-offset-2'
        : ''
    }`}
      style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}
    >
      {/* ── Cover (60%) ── */}
      <div className={`relative h-52 overflow-hidden bg-gradient-to-br ${gradient}`}>
        {/* Bottom fade */}
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-black/12 to-transparent" />

        {/* Verified badge */}
        {verified && (
          <span className="absolute top-3 right-3 inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/90 backdrop-blur-sm text-[11px] font-semibold text-emerald-600">
            <ShieldCheck size={12} /> 인증
          </span>
        )}

        {/* Select toggle */}
        {onToggleSelect && (
          <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onToggleSelect(); }}
            className={`absolute top-3 left-3 w-8 h-8 rounded-full flex items-center justify-center transition-all cursor-pointer border-0 ${
              selected
                ? 'bg-[var(--color-primary)] text-white'
                : 'bg-white/70 backdrop-blur-sm text-[var(--color-text-dim)]'
            }`}>
            {selected ? <Check size={16} strokeWidth={3} /> : <Heart size={16} />}
          </button>
        )}

        {/* Cover tags */}
        {coverTags && coverTags.length > 0 && (
          <div className="absolute bottom-3 left-3 flex gap-1.5">
            {coverTags.map(tag => (
              <span key={tag} className="px-2.5 py-1 rounded-full bg-white/90 backdrop-blur-sm text-[11px] font-semibold text-[var(--color-text)]">
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* ── Content ── */}
      <div className="px-4 pt-3 pb-3.5">
        {/* Value proposition — first thing you read */}
        <p className="text-[15px] font-medium text-[var(--color-text)] leading-snug mb-1">{valueProp}</p>

        {/* Hospital + Rating */}
        <div className="flex items-center justify-between mb-1">
          <span className="text-[13px] text-[var(--color-text-secondary)]">{hospitalName}</span>
          {rating && (
            <div className="flex items-center gap-0.5 text-[12px] text-[var(--color-text)]">
              <Star size={11} fill="currentColor" /> {rating}
            </div>
          )}
        </div>

        {/* Quote */}
        {quote && (
          <p className="text-[12px] text-[var(--color-text-dim)] leading-snug italic mb-1.5 line-clamp-1">
            &ldquo;{quote}&rdquo;
          </p>
        )}

        {/* Price + meta — secondary emphasis */}
        <div className="flex items-baseline gap-1.5 mt-1">
          <span className="text-[15px] font-semibold text-[var(--color-text)]">{price}만원</span>
          {meta && (
            <span className="text-[11px] text-[var(--color-text-dim)]">· {meta}</span>
          )}
        </div>

        {children}
      </div>
    </div>
  );
}

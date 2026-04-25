'use client';

import type { ReactNode } from 'react';
import { ShieldCheck, Star, Heart, Check } from 'lucide-react';

type CardVariant = 'primary' | 'secondary';

interface ExperienceCardProps {
  variant?: CardVariant;
  gradient: string;
  valueProp: string;
  hospitalName: string;
  verified?: boolean;
  rating?: number;
  price: number;
  meta?: string;
  coverTags?: string[];
  selected?: boolean;
  onToggleSelect?: () => void;
  quote?: string | null;
  unread?: boolean;
  children?: ReactNode;
}

export function ExperienceCard({
  variant = 'secondary',
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
  unread = false,
  children,
}: ExperienceCardProps) {
  const isPrimary = variant === 'primary';

  return (
    <div className={`rounded-[20px] overflow-hidden bg-[var(--color-bg)] transition-all duration-200 ${
      selected !== undefined && selected
        ? 'ring-2 ring-[var(--color-primary)] ring-offset-2'
        : ''
    }`}
      style={{ boxShadow: isPrimary ? 'var(--app-shadow-card-primary)' : 'var(--app-shadow-card-light)' }}
    >
      {/* ── Cover ── */}
      <div className={`relative overflow-hidden bg-gradient-to-br ${gradient} ${
        isPrimary ? 'h-60' : 'h-44'
      }`}>
        <div className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/15 to-transparent ${
          isPrimary ? 'h-24' : 'h-16'
        }`} />

        {/* Unread badge */}
        {unread && (
          <span className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-[var(--color-primary)] text-[9px] font-bold text-white tracking-wider z-10">
            NEW
          </span>
        )}

        {verified && (
          <span className={`absolute ${unread ? 'top-10' : 'top-3'} right-3 inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[var(--color-bg)]/90 backdrop-blur-sm text-[11px] font-semibold text-[var(--color-success)]`}>
            <ShieldCheck size={12} /> 인증
          </span>
        )}

        {onToggleSelect && (
          <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onToggleSelect(); }}
            className={`absolute top-3 left-3 w-8 h-8 rounded-full flex items-center justify-center transition-all cursor-pointer border-0 ${
              selected
                ? 'bg-[var(--color-primary)] text-white'
                : 'bg-[var(--color-bg)]/70 backdrop-blur-sm text-[var(--color-text-dim)]'
            }`}>
            {selected ? <Check size={16} strokeWidth={3} /> : <Heart size={16} />}
          </button>
        )}

        {coverTags && coverTags.length > 0 && (
          <div className="absolute bottom-3 left-3 flex gap-1.5">
            {coverTags.map(tag => (
              <span key={tag} className="px-2.5 py-1 rounded-full bg-[var(--color-bg)]/90 backdrop-blur-sm text-[11px] font-semibold text-[var(--color-text)]">
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* ── Content ── */}
      <div className={isPrimary ? 'px-4 pt-3.5 pb-4' : 'px-4 pt-3 pb-3.5'}>
        {/* 1. Value proposition — 가장 중요 */}
        <p className={`text-[var(--color-text)] leading-snug ${
          isPrimary ? 'text-[1rem] mb-1.5' : 'text-[15px] mb-1'
        } ${unread ? 'font-bold' : 'font-medium'}`}>{valueProp}</p>

        {/* 2. Price — 강조 */}
        <div className="flex items-baseline gap-1.5 mb-1">
          <span className={`font-bold text-[var(--color-text)] ${
            isPrimary ? 'text-[1.25rem]' : 'text-[15px]'
          }`}>{price}만원</span>
          {meta && (
            <span className="text-[11px] text-[var(--color-text-dim)]">· {meta}</span>
          )}
        </div>

        {/* 3. Hospital + Rating */}
        <div className="flex items-center justify-between">
          <span className="text-[12px] text-[var(--color-text-secondary)]">{hospitalName}</span>
          {rating && (
            <div className="flex items-center gap-0.5 text-[11px] text-[var(--color-text-dim)]">
              <Star size={10} fill="currentColor" /> {rating}
            </div>
          )}
        </div>

        {/* Quote */}
        {quote && (
          <p className="text-[11px] text-[var(--color-text-dim)] leading-snug italic mt-1.5 line-clamp-1">
            &ldquo;{quote}&rdquo;
          </p>
        )}

        {children}
      </div>
    </div>
  );
}

'use client';

import type { ReactNode } from 'react';

interface MobileBottomCTAProps {
  children: ReactNode;
  className?: string;
}

function MobileBottomCTA({ children, className = '' }: MobileBottomCTAProps) {
  return (
    <div className={`
      fixed bottom-0 left-1/2 -translate-x-1/2
      w-full max-w-[var(--fo-frame-max-width,480px)]
      z-[var(--z-sticky)]
      flex items-center gap-[var(--spacing-3)]
      px-[var(--spacing-4)] py-[var(--spacing-3)]
      pb-[calc(var(--spacing-3)+var(--fo-safe-area-bottom,0px))]
      bg-[var(--color-surface)] border-t border-[var(--color-border-light)]
      shadow-[0_-2px_8px_rgba(0,0,0,0.06)]
      ${className}
    `}>
      {children}
    </div>
  );
}

export { MobileBottomCTA };
export type { MobileBottomCTAProps };

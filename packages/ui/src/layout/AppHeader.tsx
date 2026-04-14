import type { ReactNode } from 'react';

interface AppHeaderProps {
  left?: ReactNode;
  center?: ReactNode;
  right?: ReactNode;
  className?: string;
}

function AppHeader({ left, center, right, className = '' }: AppHeaderProps) {
  return (
    <header className={`
      flex items-center justify-between h-14
      px-[var(--spacing-4)]
      bg-[var(--color-surface)] border-b border-[var(--color-border-light)]
      ${className}
    `}>
      <div className="flex items-center gap-[var(--spacing-2)]">{left}</div>
      <div className="flex-1 text-center">{center}</div>
      <div className="flex items-center gap-[var(--spacing-2)]">{right}</div>
    </header>
  );
}

export { AppHeader };
export type { AppHeaderProps };

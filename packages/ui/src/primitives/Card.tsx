import type { HTMLAttributes, ReactNode } from 'react';

type Padding = 'none' | 'sm' | 'md' | 'lg';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  padding?: Padding;
  hoverable?: boolean;
  className?: string;
}

const padStyles: Record<Padding, string> = {
  none: '',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-5',
};

function Card({ children, padding = 'md', hoverable = false, className = '', ...props }: CardProps) {
  return (
    <div
      className={`
        bg-[var(--color-surface)] rounded-2xl
        shadow-[0_1px_3px_rgba(0,0,0,0.08)]
        ${padStyles[padding]}
        ${hoverable ? 'cursor-pointer transition-shadow duration-200 hover:shadow-[0_2px_8px_rgba(0,0,0,0.12)]' : ''}
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  );
}

export { Card };
export type { CardProps };

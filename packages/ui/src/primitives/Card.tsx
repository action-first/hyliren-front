import type { HTMLAttributes, ReactNode } from 'react';

type Padding = 'none' | 'sm' | 'md' | 'lg';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  padding?: Padding;
  hoverable?: boolean;
  subdued?: boolean;
  sectioned?: boolean;
  className?: string;
}

const padStyles: Record<Padding, string> = {
  none: '',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-5',
};

function Card({ children, padding = 'md', hoverable = false, subdued = false, sectioned = false, className = '', ...props }: CardProps) {
  return (
    <div
      className={`
        ${subdued ? 'bg-[var(--color-bg-tertiary,var(--surface-subdued,#FAFBFB))]' : 'bg-[var(--color-surface,var(--surface-default,#fff))]'}
        rounded-[var(--app-radius,8px)]
        shadow-[var(--app-shadow)]
        border border-[var(--color-border-light,var(--border-subdued,#F1F1F1))]
        ${padStyles[padding]}
        ${hoverable ? 'cursor-pointer transition-shadow duration-150 hover:shadow-[var(--app-shadow-hover)]' : ''}
        ${sectioned ? '[&>*+*]:border-t [&>*+*]:border-[var(--border-subdued,#F1F1F1)] [&>*+*]:pt-4 [&>*+*]:mt-4' : ''}
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

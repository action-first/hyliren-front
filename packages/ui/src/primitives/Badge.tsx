type Variant = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'primary';
type Size = 'sm' | 'md';

interface BadgeProps {
  children: React.ReactNode;
  variant?: Variant;
  /** sm: 카드 내 보조 태그 (subtle), md: 독립 상태 표시 (기본) */
  size?: Size;
  className?: string;
}

const variantStyles: Record<Variant, Record<Size, string>> = {
  default: {
    sm: 'bg-[var(--color-bg-tertiary)] text-[var(--color-text-dim)]',
    md: 'bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)]',
  },
  success: {
    sm: 'bg-[var(--color-success-soft)] text-[var(--color-success)]',
    md: 'bg-[var(--color-success-soft)] text-[var(--color-success)]',
  },
  warning: {
    sm: 'bg-[var(--color-warning-soft)] text-[var(--color-warning)]',
    md: 'bg-[var(--color-warning-soft)] text-[var(--color-warning)]',
  },
  danger: {
    sm: 'bg-[var(--color-danger-soft)] text-[var(--color-danger)]',
    md: 'bg-[var(--color-danger-soft)] text-[var(--color-danger)]',
  },
  info: {
    sm: 'bg-[var(--color-info-soft)] text-[var(--color-info)]',
    md: 'bg-[var(--color-info-soft)] text-[var(--color-info)]',
  },
  primary: {
    sm: 'bg-[var(--color-primary-soft)] text-[var(--color-primary)]',
    md: 'bg-[var(--color-primary-soft)] text-[var(--color-primary)]',
  },
};

const sizeStyles: Record<Size, string> = {
  sm: 'px-2 py-1 text-[11px]',
  md: 'px-2.5 py-1.5 text-[12px]',
};

function Badge({ children, variant = 'default', size = 'md', className = '' }: BadgeProps) {
  return (
    <span className={`
      inline-flex items-center font-medium rounded-[var(--app-radius-sm)] whitespace-nowrap
      ${sizeStyles[size]}
      ${variantStyles[variant][size]}
      ${className}
    `}>
      {children}
    </span>
  );
}

export { Badge };
export type { BadgeProps };

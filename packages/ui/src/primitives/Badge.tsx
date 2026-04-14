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
    md: 'bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)]',
  },
  success: {
    sm: 'bg-emerald-50 text-emerald-600',
    md: 'bg-[var(--color-success-soft)] text-[var(--color-success)]',
  },
  warning: {
    sm: 'bg-amber-50 text-amber-600',
    md: 'bg-[var(--color-warning-soft)] text-amber-700',
  },
  danger: {
    sm: 'bg-red-50 text-red-500',
    md: 'bg-[var(--color-danger-soft)] text-[var(--color-danger)]',
  },
  info: {
    sm: 'bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)]',
    md: 'bg-[var(--color-info-soft)] text-[var(--color-info)]',
  },
  primary: {
    sm: 'bg-[var(--color-primary-soft)] text-[var(--color-primary)]',
    md: 'bg-[var(--color-primary-soft)] text-[var(--color-primary)]',
  },
};

const sizeStyles: Record<Size, string> = {
  sm: 'px-1.5 py-px text-[10px]',
  md: 'px-2 py-0.5 text-[11px]',
};

function Badge({ children, variant = 'default', size = 'md', className = '' }: BadgeProps) {
  return (
    <span className={`
      inline-flex items-center font-medium rounded-full whitespace-nowrap
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

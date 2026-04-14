type Variant = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'primary';

interface BadgeProps {
  children: React.ReactNode;
  variant?: Variant;
  className?: string;
}

const variantStyles: Record<Variant, string> = {
  default: 'bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)]',
  success: 'bg-[var(--color-success-soft)] text-[var(--color-success)]',
  warning: 'bg-[var(--color-warning-soft)] text-amber-700',
  danger: 'bg-[var(--color-danger-soft)] text-[var(--color-danger)]',
  info: 'bg-[var(--color-info-soft)] text-[var(--color-info)]',
  primary: 'bg-[var(--color-primary-soft)] text-[var(--color-primary)]',
};

function Badge({ children, variant = 'default', className = '' }: BadgeProps) {
  return (
    <span className={`
      inline-flex items-center px-[var(--spacing-2)] py-0.5
      text-[var(--text-xs)] font-medium rounded-full whitespace-nowrap
      ${variantStyles[variant]}
      ${className}
    `}>
      {children}
    </span>
  );
}

export { Badge };
export type { BadgeProps };

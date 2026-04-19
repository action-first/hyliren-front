'use client';

import { type ButtonHTMLAttributes, forwardRef } from 'react';

type Variant = 'primary' | 'accent' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
}

/*
  Airbnb button system:
  - primary: #222222 near-black (main action)
  - accent: #ff385c Rausch Red (CTA only — sparingly)
  - secondary: outlined
  - ghost: text only
*/
const variantStyles: Record<Variant, string> = {
  primary: 'bg-[var(--color-text,#202223)] text-[var(--color-text-inverse,#fff)] hover:opacity-90',
  accent: 'bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)]',
  secondary: 'bg-transparent text-[var(--color-text,#202223)] border border-[var(--color-border,#E1E3E5)] hover:bg-[var(--color-bg-secondary,#F1F2F3)]',
  ghost: 'bg-transparent text-[var(--color-text-secondary,#6D7175)] hover:bg-[var(--color-bg-secondary,#F1F2F3)]',
  danger: 'bg-[var(--color-danger,#D72C0D)] text-white hover:opacity-90',
};

const sizeStyles: Record<Size, string> = {
  sm: 'h-7 px-3 text-xs rounded-[var(--app-radius-sm,4px)]',
  md: 'h-8 px-4 text-sm rounded-[var(--app-radius-sm,4px)]',
  lg: 'h-9 px-5 text-sm rounded-[var(--app-radius-sm,4px)] font-medium',
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', fullWidth = false, className = '', children, ...props }, ref) => (
    <button
      ref={ref}
      className={`
        inline-flex items-center justify-center gap-2 font-medium
        transition-all duration-150
        disabled:opacity-[var(--opacity-disabled)] disabled:cursor-not-allowed
        cursor-pointer select-none
        active:scale-[0.98]
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--input-border-focus)] focus-visible:ring-offset-2
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `}
      {...props}
    >
      {children}
    </button>
  )
);

Button.displayName = 'Button';
export { Button };
export type { ButtonProps };

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
  primary: 'bg-[#222222] text-white hover:bg-[#000000]',
  accent: 'bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)]',
  secondary: 'bg-transparent text-[var(--color-text)] border border-[var(--color-border)] hover:bg-[var(--color-bg-secondary)]',
  ghost: 'bg-transparent text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-secondary)]',
  danger: 'bg-[var(--color-danger)] text-white hover:opacity-90',
};

const sizeStyles: Record<Size, string> = {
  sm: 'h-8 px-4 text-sm rounded-lg',
  md: 'h-10 px-6 text-base rounded-lg',
  lg: 'h-12 px-6 text-base rounded-lg font-medium',
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', fullWidth = false, className = '', children, ...props }, ref) => (
    <button
      ref={ref}
      className={`
        inline-flex items-center justify-center gap-2 font-medium
        transition-all duration-150
        disabled:opacity-40 disabled:cursor-not-allowed
        cursor-pointer select-none
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

'use client';

import { type InputHTMLAttributes, forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = '', id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
    return (
      <div className="flex flex-col gap-[var(--spacing-1)]">
        {label && (
          <label htmlFor={inputId} className="text-[var(--app-text-small)] font-medium text-[var(--color-text)]">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={`
            w-full py-[var(--spacing-3)] px-[var(--spacing-4)]
            text-[var(--app-text-body)] text-[var(--color-text)]
            bg-[var(--color-bg)] border rounded-[var(--app-radius)]
            outline-none transition-colors duration-[var(--duration-fast)]
            placeholder:text-[var(--color-text-dim)]
            ${error ? 'border-[var(--color-danger)]' : 'border-[var(--color-border)] focus:border-[var(--color-primary)]'}
            ${className}
          `}
          {...props}
        />
        {error && <p className="text-[var(--text-xs)] text-[var(--color-danger)] m-0">{error}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
export { Input };
export type { InputProps };

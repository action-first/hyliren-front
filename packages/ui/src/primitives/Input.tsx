'use client';

import { type InputHTMLAttributes, forwardRef, useId } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = '', id, ...props }, ref) => {
    const generatedId = useId();
    const inputId = id || generatedId;
    return (
      <div className="flex flex-col gap-[var(--spacing-1)]">
        {label && (
          <label htmlFor={inputId} className="text-[var(--app-text-label,12px)] font-semibold text-[var(--text-subdued,#6D7175)]">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={`
            w-full h-[var(--input-height,32px)] px-2
            text-[var(--app-text-body,13px)] text-[var(--text-default,#202223)]
            bg-[var(--input-bg,#fff)] border rounded-[var(--input-radius,4px)]
            outline-none transition-colors duration-[var(--duration-fast)]
            placeholder:text-[var(--color-text-dim)]
            disabled:bg-[var(--input-bg-disabled)] disabled:opacity-[var(--opacity-disabled)] disabled:cursor-not-allowed
            ${error ? 'border-[var(--color-danger)]' : 'border-[var(--input-border)] hover:border-[var(--color-text-dim)] focus:border-[var(--input-border-focus)] focus:shadow-[0_0_0_3px_var(--input-focus-ring)]'}
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

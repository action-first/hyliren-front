'use client';

import { type TextareaHTMLAttributes, forwardRef } from 'react';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, className = '', id, ...props }, ref) => {
    const tid = id || label?.toLowerCase().replace(/\s+/g, '-');
    return (
      <div className="flex flex-col gap-[var(--spacing-1)]">
        {label && (
          <label htmlFor={tid} className="text-[var(--app-text-small)] font-medium text-[var(--color-text)]">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={tid}
          className={`
            w-full py-[var(--spacing-3)] px-[var(--spacing-4)] min-h-24 resize-y
            text-[var(--app-text-body)] text-[var(--color-text)]
            bg-[var(--input-bg)] border rounded-[var(--app-radius)]
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

Textarea.displayName = 'Textarea';
export { Textarea };
export type { TextareaProps };

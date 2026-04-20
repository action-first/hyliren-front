'use client';

import {
  type HTMLAttributes,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react';

export interface SelectOption {
  value: string;
  label: ReactNode;
  description?: ReactNode;
}

export interface SelectProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onChange'> {
  label?: string;
  error?: string;
  value: string;
  options: readonly SelectOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  id?: string;
  name?: string;
}

function Select({
  label,
  error,
  value,
  options,
  onChange,
  placeholder = '선택하세요',
  disabled = false,
  className = '',
  id,
  name,
  ...props
}: SelectProps) {
  const generatedId = useId();
  const selectId = id || generatedId;
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);

  const selected = useMemo(
    () => options.find(option => option.value === value) ?? null,
    [options, value],
  );

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpen(false);
        buttonRef.current?.focus();
      }
    }

    document.addEventListener('mousedown', handlePointerDown);
    window.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      window.removeEventListener('keydown', handleEscape);
    };
  }, [open]);

  function handleKeyDown(event: ReactKeyboardEvent<HTMLButtonElement>) {
    if (disabled) return;
    if (event.key === 'ArrowDown' || event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      setOpen(true);
    }
  }

  function handleSelect(nextValue: string) {
    onChange(nextValue);
    setOpen(false);
    buttonRef.current?.focus();
  }

  return (
    <div ref={containerRef} className={`flex flex-col gap-[var(--spacing-1)] ${className}`} {...props}>
      {label ? (
        <label htmlFor={selectId} className="text-[var(--app-text-label,12px)] font-semibold text-[var(--text-subdued,#6D7175)]">
          {label}
        </label>
      ) : null}
      <div className="relative">
        {name ? <input type="hidden" name={name} value={value} /> : null}
        <button
          ref={buttonRef}
          id={selectId}
          type="button"
          disabled={disabled}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={`${selectId}-listbox`}
          onClick={() => setOpen(current => !current)}
          onKeyDown={handleKeyDown}
          className={`
            w-full h-[var(--input-height,32px)] px-2 pr-9
            text-left text-[var(--app-text-body,13px)] text-[var(--text-default,#202223)]
            bg-[var(--input-bg,#fff)] border rounded-[var(--input-radius,4px)]
            outline-none transition-colors duration-[var(--duration-fast)]
            disabled:bg-[var(--input-bg-disabled)] disabled:opacity-[var(--opacity-disabled)] disabled:cursor-not-allowed
            ${error ? 'border-[var(--color-danger)]' : 'border-[var(--input-border)] hover:border-[var(--border-strong)] focus:border-[var(--input-border-focus)] focus:shadow-[0_0_0_3px_var(--input-focus-ring)]'}
          `}
        >
          <span className={selected ? 'block truncate' : 'block truncate text-[var(--text-disabled)]'}>
            {selected?.label ?? placeholder}
          </span>
          <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-[var(--text-disabled)]">
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={`transition-transform duration-150 ${open ? 'rotate-180' : ''}`}
              aria-hidden="true"
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </span>
        </button>

        {open ? (
          <div
            id={`${selectId}-listbox`}
            role="listbox"
            aria-labelledby={selectId}
            className="absolute left-0 right-0 top-[calc(100%+6px)] z-[var(--z-dropdown)] overflow-hidden rounded-[var(--input-radius,4px)] border border-[var(--border-default)] bg-[var(--surface-default)] shadow-[var(--app-shadow)]"
          >
            <div className="max-h-60 overflow-y-auto py-1">
              {options.map(option => {
                const isSelected = option.value === value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => handleSelect(option.value)}
                    className={`
                      flex w-full flex-col items-start gap-0.5 px-3 py-2 text-left
                      transition-colors duration-[var(--duration-fast)]
                      ${isSelected
                        ? 'bg-[var(--surface-selected)] text-[var(--interactive-default)]'
                        : 'text-[var(--text-default)] hover:bg-[var(--surface-hovered)]'}
                    `}
                  >
                    <span className="text-[13px] font-medium leading-5">{option.label}</span>
                    {option.description ? (
                      <span className="text-[11px] leading-4 text-[var(--text-disabled)]">
                        {option.description}
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}
      </div>
      {error ? <p className="m-0 text-[var(--text-xs)] text-[var(--color-danger)]">{error}</p> : null}
    </div>
  );
}

export { Select };

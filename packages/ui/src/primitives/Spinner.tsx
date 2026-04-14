interface SpinnerProps {
  size?: number;
  className?: string;
}

function Spinner({ size = 20, className = '' }: SpinnerProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={`animate-spin ${className}`}
    >
      <circle cx="12" cy="12" r="10" stroke="var(--color-border)" strokeWidth="3" />
      <path
        d="M12 2a10 10 0 0 1 10 10"
        stroke="var(--color-primary)"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}

export { Spinner };

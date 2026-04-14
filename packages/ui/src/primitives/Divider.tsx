interface DividerProps {
  className?: string;
}

function Divider({ className = '' }: DividerProps) {
  return <div className={`h-px bg-[var(--color-border-light)] ${className}`} />;
}

export { Divider };

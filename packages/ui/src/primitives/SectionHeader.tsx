interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  className?: string;
}

function SectionHeader({ title, subtitle, action, className = '' }: SectionHeaderProps) {
  return (
    <div className={`flex items-start justify-between gap-[var(--spacing-4)] ${className}`}>
      <div>
        <h2 className="text-[var(--text-lg)] font-bold text-[var(--color-text)] m-0">{title}</h2>
        {subtitle && <p className="text-[var(--app-text-small)] text-[var(--color-text-secondary)] mt-[var(--spacing-1)]">{subtitle}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

export { SectionHeader };
export type { SectionHeaderProps };

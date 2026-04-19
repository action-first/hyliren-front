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
        <h2 className="text-[var(--app-text-section-title,14px)] font-semibold text-[var(--text-default,#202223)] m-0 tracking-[-0.02em]">{title}</h2>
        {subtitle && <p className="text-[var(--app-text-small,12px)] text-[var(--text-subdued,#6D7175)] mt-1">{subtitle}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

export { SectionHeader };
export type { SectionHeaderProps };

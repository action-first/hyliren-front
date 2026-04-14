type Size = 'sm' | 'md' | 'lg';

interface AvatarProps {
  src?: string | null;
  name: string;
  size?: Size;
  className?: string;
}

const sizeStyles: Record<Size, string> = {
  sm: 'w-8 h-8 text-[var(--text-xs)]',
  md: 'w-10 h-10 text-[var(--text-sm)]',
  lg: 'w-14 h-14 text-[var(--text-md)]',
};

function Avatar({ src, name, size = 'md', className = '' }: AvatarProps) {
  return (
    <div className={`
      inline-flex items-center justify-center rounded-full
      bg-[var(--color-bg-secondary)] overflow-hidden shrink-0
      ${sizeStyles[size]} ${className}
    `}>
      {src ? (
        <img src={src} alt={name} className="w-full h-full object-cover" />
      ) : (
        <span className="font-semibold text-[var(--color-text-secondary)]">{name.slice(0, 2)}</span>
      )}
    </div>
  );
}

export { Avatar };
export type { AvatarProps };

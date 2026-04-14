import type { ReactNode } from 'react';

interface PageContainerProps {
  children: ReactNode;
  hasBottomBar?: boolean;
  className?: string;
}

function PageContainer({ children, hasBottomBar = false, className = '' }: PageContainerProps) {
  return (
    <div className={`w-full max-w-[1200px] mx-auto px-[var(--spacing-4)] ${hasBottomBar ? 'pb-20' : ''} ${className}`}>
      {children}
    </div>
  );
}

export { PageContainer };
export type { PageContainerProps };

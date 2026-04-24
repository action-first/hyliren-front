'use client';

import { useEffect } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Spinner } from '@hyliren/ui';
import { usePOAuthStore } from '@/store/po-auth';

const PUBLIC_PATHS = new Set(['/login']);

export function PartnerAuthGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const status = usePOAuthStore(s => s.status);
  const member = usePOAuthStore(s => s.member);

  const isPublic = PUBLIC_PATHS.has(pathname);
  const isChecking = status === 'idle' || status === 'authenticating';
  const isAuthenticated = status === 'authenticated' && !!member;

  useEffect(() => {
    if (isPublic || isChecking || isAuthenticated) return;

    const query = searchParams.toString();
    const next = `${pathname}${query ? `?${query}` : ''}`;
    router.replace(`/login?next=${encodeURIComponent(next)}`);
  }, [isAuthenticated, isChecking, isPublic, pathname, router, searchParams]);

  if (isPublic) return <>{children}</>;
  if (isChecking || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--surface-bg)]">
        <Spinner />
      </div>
    );
  }

  return <>{children}</>;
}

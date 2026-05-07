'use client';

import { useEffect } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Spinner } from '@hyliren/ui';
import { useBOAuthStore } from '@/store/bo-auth';

const PUBLIC_PATHS = new Set(['/login']);

/**
 * Client-side admin auth gate (PO 의 PartnerAuthGate 와 동형).
 *
 * BOSessionBootstrap 이 mount 시 token 으로 /auth/me 복원 시도.
 * 결과가 guest 면 본 gate 가 즉시 /login 으로 리다이렉트.
 *
 * 서버 401·세션 만료·token 탈취 후 BE 거부 등 모든 케이스에서 status 가 guest
 * 로 떨어지면 본 gate 가 동작.
 */
export function BOAuthGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const status = useBOAuthStore((s) => s.status);
  const member = useBOAuthStore((s) => s.member);

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

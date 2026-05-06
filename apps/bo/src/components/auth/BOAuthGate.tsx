'use client';

import { useEffect } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Spinner } from '@hyliren/ui';
import { useBOAuthStore } from '@/store/bo-auth';

const PUBLIC_PATHS = new Set(['/login']);

/**
 * Client-side defense-in-depth gate.
 *
 * middleware.ts 가 cookie 검증을 SSR 단계에서 마쳤으므로 일반적으로 본 컴포넌트는
 * 통과만 함. 그러나 /me 응답이 401 (서버에서 cookie 만료/admin role 박탈) 인 경우
 * client store 가 guest 로 떨어지고 — 이때 본 gate 가 즉시 /login 으로 리다이렉트.
 *
 * middleware + client gate 이중화로 cookie tampering·서버 401·세션 만료 모든 케이스 차단.
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

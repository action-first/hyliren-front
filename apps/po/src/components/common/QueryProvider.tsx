'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';

/**
 * React Query 전역 Provider.
 *
 * 정책 (PO 운영 도구 관점):
 * - staleTime 5분: concerns/proposals 같은 운영 데이터는 너무 자주 fetch 하면 부담
 * - refetchOnWindowFocus false: 사용자 입력 중 갑작스런 refetch 로 form state 흔들리지 않게
 * - retry 1: 잠깐의 네트워크 문제는 한 번 재시도, 영구 실패는 즉시 노출
 *
 * 캐시 키 컨벤션 (apps/po/src/hooks/queries/keys.ts 에 통일):
 * - ['concerns', query] / ['concerns', id]
 * - ['my-proposals', query] / ['concerns', concernId, 'my-proposal']
 */
export function QueryProvider({ children }: { children: ReactNode }) {
  // useState 로 lazy init — 매 render 마다 새 인스턴스 생성 방지.
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000, // 5분
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      }),
  );

  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

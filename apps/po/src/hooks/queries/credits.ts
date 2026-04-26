import { useQuery } from '@tanstack/react-query';
import { creditsApi } from '@/lib/api/credits';
import { queryKeys } from './keys';

/**
 * 본인 크레딧 잔액. POSidebar 등 항상 보이는 위젯이라 staleTime 짧게.
 *
 * - 잔액 row 미존재 시 BE 가 0 으로 응답 → undefined 처리 안 해도 됨
 * - 제안서 발송 / 충전 시 mutation 에서 invalidate (자동 갱신)
 */
export function useCreditBalance() {
  return useQuery({
    queryKey: queryKeys.credits.balance(),
    queryFn: () => creditsApi.getMyBalance(),
    /* 1분 — 다른 query 보다 짧게. 잔액은 잦은 업데이트 후보. */
    staleTime: 60 * 1000,
  });
}

/**
 * 본인 크레딧 거래 이력. /activity 통합 타임라인에서 사용.
 *
 * 이력은 append-only 라 staleTime 길게 잡아도 OK. mutation 시 invalidate.
 */
export function useCreditTransactions() {
  return useQuery({
    queryKey: queryKeys.credits.transactions(),
    queryFn: () => creditsApi.listMyTransactions(),
  });
}

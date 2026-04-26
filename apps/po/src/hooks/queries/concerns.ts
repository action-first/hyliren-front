import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { listConcerns, type ConcernListQuery } from '@/lib/api/concern';
import { queryKeys } from './keys';

/**
 * 고민 목록 조회 (본인 미발송 + 제안 가능 상태).
 *
 * - placeholderData: keepPreviousData → 검색 변경 중에도 이전 결과 노출 (UX 부드러움)
 * - staleTime: 전역 5분 (QueryProvider 디폴트). 페이지 간 이동 시 즉시 cache hit.
 */
export function useConcerns(query?: ConcernListQuery) {
  return useQuery({
    queryKey: queryKeys.concerns.list(query),
    queryFn: () => listConcerns(query),
    placeholderData: keepPreviousData,
  });
}

import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { listMyProposals, type MyProposalsQuery } from '@/lib/api/proposal';
import { queryKeys } from './keys';

/**
 * 본인 제안서 목록.
 *
 * 페이지 간 공유 캐시 — /proposals, /activity, /dashboard 가 동일 키 사용해
 * 한 번 fetch 후 5분간 cache hit. 검색 query 변경 시 별도 키.
 */
export function useMyProposals(query?: MyProposalsQuery) {
  return useQuery({
    queryKey: queryKeys.proposals.listMine(query),
    queryFn: () => listMyProposals(query),
    placeholderData: keepPreviousData,
  });
}

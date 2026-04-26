import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { proceduresApi } from '@/lib/api/procedures';
import type { ProcedureStatus } from '@hyliren/shared';
import { queryKeys } from './keys';

/**
 * 시술 목록 — status 별로 분리 캐시 (탭 전환 시 각 탭 독립 캐시).
 *
 * - placeholderData: keepPreviousData → 탭 전환 중 이전 데이터 유지
 * - undefined status = 전체 (BE 가 모든 status 반환)
 */
export function useProcedures(status?: ProcedureStatus | undefined) {
  return useQuery({
    queryKey: queryKeys.procedures.list(status),
    queryFn: () => proceduresApi.list(status ? { status } : {}),
    placeholderData: keepPreviousData,
  });
}

/**
 * 시술 상세 (procedure + variants).
 *
 * - id null/empty 시 disabled (편집 페이지 진입 전 mount 보호)
 * - 페이지 간 cache 공유: 동일 id 재진입 시 cache hit
 */
export function useProcedure(id: string | null | undefined) {
  return useQuery({
    queryKey: queryKeys.procedures.detail(id ?? ''),
    queryFn: () => {
      if (!id) throw new Error('procedure id required');
      return proceduresApi.get(id);
    },
    enabled: !!id,
  });
}

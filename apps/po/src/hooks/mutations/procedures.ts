import { useMutation, useQueryClient } from '@tanstack/react-query';
import { proceduresApi } from '@/lib/api/procedures';
import { queryKeys } from '@/hooks/queries/keys';

/**
 * 시술 mutation hooks — 성공 시 자동 invalidateQueries.
 *
 * 정책:
 * - 모든 procedure 변경은 list 캐시 (queryKeys.procedures.all) 무효화
 * - 변경된 단일 procedure 의 detail 캐시도 무효화 (id 인자 보유한 mutation 한정)
 * - 호출자는 onSuccess / onError 추가 콜백 (toast / nav) 만 담당
 */

/** 비공개 전환 (published → archived). */
export function useArchiveProcedure() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => proceduresApi.softDelete(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.procedures.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.procedures.detail(id) });
    },
  });
}

/** 공개 전환 (archived → published). BE 가 publish-strict 검증 자동 수행. */
export function useUnarchiveProcedure() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => proceduresApi.update(id, { status: 'published' }),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.procedures.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.procedures.detail(id) });
    },
  });
}

/** 영구 삭제 (논리 삭제 — deletedAt 세팅, BE PR #20). archived 한정. */
export function usePermanentDeleteProcedure() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => proceduresApi.permanentDelete(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.procedures.all });
      // 삭제된 detail 도 무효화 — 캐시 잔존 시 stale 노출 방지
      queryClient.invalidateQueries({ queryKey: queryKeys.procedures.detail(id) });
    },
  });
}

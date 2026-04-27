import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createProposal, type CreateProposalBody, type ProposalDetailWire } from '@/lib/api/proposal';
import { queryKeys } from '@/hooks/queries/keys';

/**
 * 제안서 mutation hooks — 성공 시 자동 invalidateQueries.
 *
 * 영향 범위:
 * - proposals.all: /proposals, /activity, /dashboard 의 제안서 목록 갱신
 * - concerns.all: concern 의 mySentAt / proposalCount 변경 → 목록 cell 갱신
 * - concerns.myProposal(concernId): MyProposalSheet 가 새 제안서 즉시 노출
 */

/** 새 제안서 생성. 성공 시 proposals + concerns 모두 무효화. */
export function useCreateProposal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ concernId, body }: { concernId: string; body: CreateProposalBody }) =>
      createProposal(concernId, body),
    onSuccess: (data: ProposalDetailWire, variables) => {
      // 발송 후: proposals 목록 (모든 query 변형) + concerns 목록·상세 갱신
      queryClient.invalidateQueries({ queryKey: queryKeys.proposals.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.concerns.all });
      // 발송 시 BE 가 크레딧 차감 → 잔액·거래이력 cache 무효화
      queryClient.invalidateQueries({ queryKey: queryKeys.credits.all });
      // 같은 concern 의 myProposal 캐시는 직접 set — round-trip 회피
      queryClient.setQueryData(queryKeys.concerns.myProposal(variables.concernId), data);
    },
  });
}

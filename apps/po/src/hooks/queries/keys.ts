import type { ConcernListQuery } from '@/lib/api/concern';
import type { MyProposalsQuery } from '@/lib/api/proposal';

/**
 * React Query 키 컨벤션 — 한곳에서 통일.
 *
 * 패턴: ['domain', ...specifiers]. 하위 호환:
 * - 단순 무효화: queryClient.invalidateQueries({ queryKey: ['concerns'] }) 가
 *   하위 모든 키 (['concerns', query] / ['concerns', id]) 일괄 처리.
 */
export const queryKeys = {
  concerns: {
    all: ['concerns'] as const,
    list: (query?: ConcernListQuery) => ['concerns', 'list', query ?? {}] as const,
    detail: (id: string) => ['concerns', 'detail', id] as const,
    /** concern × member 의 본인 제안서 (없으면 null). */
    myProposal: (concernId: string) => ['concerns', concernId, 'my-proposal'] as const,
  },
  proposals: {
    all: ['proposals'] as const,
    listMine: (query?: MyProposalsQuery) => ['proposals', 'me', query ?? {}] as const,
    detail: (id: string) => ['proposals', 'detail', id] as const,
  },
  procedures: {
    all: ['procedures'] as const,
    list: (status?: string) => ['procedures', 'list', status ?? 'all'] as const,
    detail: (id: string) => ['procedures', 'detail', id] as const,
  },
  credits: {
    all: ['credits'] as const,
    balance: () => ['credits', 'balance'] as const,
    transactions: () => ['credits', 'transactions'] as const,
  },
} as const;

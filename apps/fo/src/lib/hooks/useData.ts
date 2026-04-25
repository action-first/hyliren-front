/**
 * FO 데이터 hooks 배럴.
 *
 * concern/proposal 의 real API hooks 를 한 곳에서 re-export.
 * partner profile / concern photo 는 백엔드 응답에 임베디드되므로
 * 별도 hook 불필요 — 호출 측이 detail 응답에서 직접 사용.
 */

export { useMyConcerns, useConcern } from '@/lib/hooks/concern';
export { useProposalsForConcern } from '@/lib/hooks/proposal';

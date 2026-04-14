import type { ExtractResult, FeedbackTurn } from '../concern-analysis/types';
import { extractMock } from './extract.mock';

/**
 * Extract Layer — 사진 + narrative → structured tags
 *
 * LLM은 추출만 수행. 판단/추천 금지.
 * 현재: mock 구현 → 추후 OpenAI GPT-4o-mini로 교체
 */
export async function extractConcernTags(
  narrative: string,
  photos: string[],
  feedbackTurns: FeedbackTurn[] = [],
): Promise<ExtractResult> {
  // TODO: real LLM mode
  // if (process.env.ANALYSIS_MODE === 'llm') {
  //   return extractWithLLM(narrative, photos, feedbackTurns);
  // }

  return extractMock(narrative, feedbackTurns);
}

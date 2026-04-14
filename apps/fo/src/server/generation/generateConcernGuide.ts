import type { ExtractedTags, RuleMatchResult, GeneratedGuide, FeedbackTurn } from '../concern-analysis/types';
import { generateMock } from './generate.mock';

/**
 * Generation Layer — 공감 + 교육 + 옵션 안내 텍스트 생성
 *
 * LLM은 표현만 담당. 판단/추천은 Rule Engine에서 완료됨.
 * 현재: mock 구현 → 추후 GPT-4o-mini로 교체
 */
export async function generateConcernGuide(
  narrative: string,
  tags: ExtractedTags,
  ruleResult: RuleMatchResult,
  feedbackTurns: FeedbackTurn[] = [],
): Promise<GeneratedGuide> {
  // TODO: real LLM mode
  // if (process.env.ANALYSIS_MODE === 'llm') {
  //   return generateWithLLM(narrative, tags, ruleResult, feedbackTurns);
  // }

  return generateMock(narrative, tags, ruleResult, feedbackTurns);
}

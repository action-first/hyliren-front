import type { ExtractResult, FeedbackTurn } from '../concern-analysis/types';
import { extractMock } from './extract.mock';

/**
 * Extract Layer — 사진 + narrative → structured tags
 *
 * LLM은 추출만 수행. 판단/추천 금지.
 * 현재: mock 구현 → 추후 OpenAI GPT-4o-mini로 교체
 *
 * sourceLocale: narrative 가 작성된 언어 (Accept-Language 기반 추론).
 * mock 단계에선 ko 사전만 있어 ko 외 narrative 는 매칭 0 → fallback tag.
 * 자동 번역/LLM 도입 시점에 locale 별 사전 또는 LLM 처리.
 */
export async function extractConcernTags(
  narrative: string,
  photos: string[],
  feedbackTurns: FeedbackTurn[] = [],
  sourceLocale: 'ko' | 'zh-CN' | 'ja' | 'en' = 'ko',
): Promise<ExtractResult> {
  // TODO: real LLM mode
  // if (process.env.ANALYSIS_MODE === 'llm') {
  //   return extractWithLLM(narrative, photos, feedbackTurns, sourceLocale);
  // }

  return extractMock(narrative, feedbackTurns, sourceLocale);
}

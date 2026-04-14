import type { AnalysisRequest, AnalysisResponse } from './types';
import { extractConcernTags } from '../extract/extractConcernTags';
import { matchProcedures } from '../rule-engine/matchProcedures';
import { generateConcernGuide } from '../generation/generateConcernGuide';

/**
 * Concern Analysis Service — 3-layer orchestrator
 *
 * Extract → Rule → Generation
 *
 * 에러 발생 시 각 layer별 fallback:
 * - extract 실패 → generic tags
 * - rule match 없음 → generic consultation guidance
 * - generation 실패 → raw summary + basic description
 */
export async function analyzeConcernService(
  request: AnalysisRequest,
): Promise<AnalysisResponse> {
  const { photos, narrative, feedbackTurns = [] } = request;

  /* ── Layer 1: Extract ── */
  let extractResult;
  try {
    extractResult = await extractConcernTags(narrative, photos, feedbackTurns);
  } catch {
    // Fallback: generic tags
    console.warn('[ANALYSIS] Extract failed, using fallback');
    extractResult = {
      tags: {
        symptoms: ['미분류_고민'],
        preferences: ['자연스러움_선호'],
        budget: [],
        timing: [],
      },
      summary: {
        bodyArea: '기타',
        bodyAreaDetail: '종합',
        desiredOutcome: '자연스러운 개선',
        budgetMax: null,
        visitDate: null,
      },
    };
  }

  /* ── Layer 2: Rule ── */
  const ruleResult = matchProcedures(extractResult.tags);

  /* ── Layer 3: Generation ── */
  let guide;
  try {
    guide = await generateConcernGuide(narrative, extractResult.tags, ruleResult, feedbackTurns);
  } catch {
    // Fallback: basic description
    console.warn('[ANALYSIS] Generation failed, using fallback');
    guide = {
      empathy: '고민을 나눠주셔서 감사합니다.',
      education: '고객님의 상황에 맞는 방법을 여러 병원의 의견을 통해 찾아보시는 것을 권합니다.',
      options: ruleResult.matchedOptions.map(o => ({
        key: o.key, name: o.name, description: o.description,
      })),
      disclaimer: '정확한 적용 여부는 실제 병원의 상담과 진단을 통해 결정됩니다.',
    };
  }

  return {
    empathy: guide.empathy,
    education: guide.education,
    options: guide.options,
    extractedTags: extractResult.tags,
    extractedSummary: extractResult.summary,
    disclaimer: guide.disclaimer,
    ruleVersion: ruleResult.ruleVersion,
  };
}

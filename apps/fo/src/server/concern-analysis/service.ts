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
        bodyAreas: ['기타'],
        primaryArea: '기타',
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
    // Fallback: i18n key 만 반환 — FE 가 viewerLocale 기준 번역.
    console.warn('[ANALYSIS] Generation failed, using fallback');
    guide = {
      empathy: { key: 'concern.analysis.empathy.fallback' },
      education: { key: 'concern.analysis.education.fallback' },
      options: ruleResult.matchedOptions.map(o => ({
        key: o.key, name: o.name, description: o.description, bodyArea: o.bodyArea,
      })),
      disclaimer: { key: 'concern.analysis.disclaimer' },
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

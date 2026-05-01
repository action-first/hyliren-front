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
  const { photos, narrative, feedbackTurns = [], sourceLocale } = request;
  const narrativeLocale = (sourceLocale ?? 'ko') as 'ko' | 'zh-CN' | 'ja' | 'en';

  /* ── Layer 1: Extract ── */
  let extractResult;
  try {
    extractResult = await extractConcernTags(narrative, photos, feedbackTurns, narrativeLocale);
  } catch {
    // Fallback: generic tags. bodyArea 는 enum key (BodyArea.ETC), 자유 텍스트는 빈 문자열.
    // FE 가 viewerLocale 기준 t('common.bodyArea.etc') 로 라벨 매핑 + 빈 detail 은 라벨 미노출 처리.
    console.warn('[ANALYSIS] Extract failed, using fallback');
    extractResult = {
      tags: {
        symptoms: ['미분류_고민'],
        preferences: ['자연스러움_선호'],
        budget: [],
        timing: [],
      },
      summary: {
        bodyAreas: ['etc'],
        primaryArea: 'etc',
        bodyAreaDetail: '',
        desiredOutcome: '',
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

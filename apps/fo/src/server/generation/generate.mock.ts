import type { ExtractedTags, RuleMatchResult, GeneratedGuide, FeedbackTurn, I18nMessage } from '../concern-analysis/types';

/**
 * Concern 분석 결과 mock — i18n key 패턴.
 *
 * "BE 는 번역 안 함, FE 판별" 정책에 따라 한국어 raw 대신 i18n key + params 만 반환.
 * FE 컴포넌트가 useLocaleStore.t(key, params) 로 viewerLocale 기준 번역.
 *
 * 콘텐츠 자연어 다국어는 별도 트랙 (자동 번역 도입 시점에 일괄 작성). 현재는 ko 자연어 +
 * 다른 locale 은 ko fallback (i18n.t 가 키 누락 시 ko 로 자동 fallback — 인프라 차원 안전).
 */

const DISCLAIMER: I18nMessage = { key: 'concern.analysis.disclaimer' };

/* ── Empathy 매핑: bodyArea(한국어 raw, BODY_AREAS Stage 3 까지 유지) → 시술군 → i18n key ── */
const EMPATHY_KEY: Record<string, Record<string, string>> = {
  '눈': {
    '눈매교정': 'concern.analysis.empathy.eye.eyelines',
    '쌍꺼풀': 'concern.analysis.empathy.eye.doubleEyelid',
    '눈밑': 'concern.analysis.empathy.eye.underEye',
    _default: 'concern.analysis.empathy.eye.default',
  },
  '코': { _default: 'concern.analysis.empathy.nose.default' },
  '리프팅': { _default: 'concern.analysis.empathy.lifting.default' },
  '피부': { _default: 'concern.analysis.empathy.skin.default' },
};

const EDUCATION_KEY: Record<string, Record<string, string>> = {
  '눈': {
    '눈매교정': 'concern.analysis.education.eye.eyelines',
    '쌍꺼풀': 'concern.analysis.education.eye.doubleEyelid',
    '눈밑': 'concern.analysis.education.eye.underEye',
    _default: 'concern.analysis.education.eye.default',
  },
  '코': { _default: 'concern.analysis.education.nose.default' },
  '리프팅': { _default: 'concern.analysis.education.lifting.default' },
  '피부': { _default: 'concern.analysis.education.skin.default' },
};

export function generateMock(
  _narrative: string,
  _tags: ExtractedTags,
  ruleResult: RuleMatchResult,
  feedbackTurns: FeedbackTurn[] = [],
): GeneratedGuide {
  const areas = ruleResult.bodyAreas;
  const primaryArea = ruleResult.primaryArea;

  const isMulti = areas.length > 1;

  // Empathy
  const empathy: I18nMessage = isMulti
    ? { key: 'concern.analysis.empathy.multi', params: { areas: areas.join('·') } }
    : { key: EMPATHY_KEY[primaryArea]?._default ?? 'concern.analysis.empathy.fallback' };

  // Education — multi-area 시 부위별 default 키 합성은 FE 에서 처리 어려움 → 단일 multi 키 + 부위 params.
  const education: I18nMessage = isMulti
    ? { key: 'concern.analysis.education.multi', params: { areas: areas.join('·') } }
    : { key: EDUCATION_KEY[primaryArea]?._default ?? 'concern.analysis.education.fallback' };

  // Feedback refinements — 추가 안내 멘트는 별도 키 suffix 로 합성하지 않고
  // 본 키만 반환. 정밀 안내는 후속 콘텐츠 작업에서 multi-key 패턴으로 확장.
  const userFeedback = feedbackTurns
    .filter(t => t.role === 'user')
    .map(t => t.message.toLowerCase())
    .join(' ');
  if (userFeedback.includes('절개') && (userFeedback.includes('부담') || userFeedback.includes('싫'))) {
    education.params = { ...(education.params ?? {}), refine: 'noIncision' };
  }
  if (userFeedback.includes('회복') && (userFeedback.includes('짧') || userFeedback.includes('빠'))) {
    education.params = { ...(education.params ?? {}), refine: 'fastRecovery' };
  }

  // Options from rule result (이미 i18n 무관 raw key + 한국어 name — name 은 후속 다국어 트랙)
  const options = ruleResult.matchedOptions.map(opt => ({
    key: opt.key,
    name: opt.name,
    description: opt.description,
    bodyArea: opt.bodyArea,
  }));

  return {
    empathy,
    education,
    options,
    disclaimer: DISCLAIMER,
  };
}

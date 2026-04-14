import type { ExtractedTags, RuleMatchResult, MatchedOption } from '../concern-analysis/types';
import { PROCEDURE_RULES } from './procedure-rules';
import { getOptionByKey } from './procedure-options';
import { RULE_VERSION } from './version';

const MAX_OPTIONS = 3;
const OPTIONAL_TAG_BONUS = 10;

/**
 * Rule-based procedure matching
 *
 * Scoring logic:
 * 1. requiredTags 모두 충족 → base score = rule.priority
 * 2. optionalTags 매치 → +OPTIONAL_TAG_BONUS per match
 * 3. excludedTags 매치 → 해당 rule 제외
 * 4. 동일 option이 여러 rule에서 매칭 → 최고 점수 사용
 * 5. 점수 순 상위 MAX_OPTIONS개 반환
 */
export function matchProcedures(tags: ExtractedTags): RuleMatchResult {
  const allTags = [...tags.symptoms, ...tags.preferences];
  const optionScores = new Map<string, number>();

  for (const rule of PROCEDURE_RULES) {
    // Check required tags
    const requiredMet = rule.requiredTags.every(rt => allTags.includes(rt));
    if (!requiredMet) continue;

    // Check excluded tags
    const excluded = rule.excludedTags.some(et => allTags.includes(et));
    if (excluded) continue;

    // Calculate score
    let score = rule.priority;
    for (const ot of rule.optionalTags) {
      if (allTags.includes(ot)) score += OPTIONAL_TAG_BONUS;
    }

    // Assign score to each preferred option
    for (const optKey of rule.preferredOptions) {
      const existing = optionScores.get(optKey) || 0;
      optionScores.set(optKey, Math.max(existing, score));
    }
  }

  // Build matched options sorted by score
  const matched: MatchedOption[] = [];
  for (const [key, score] of optionScores) {
    const option = getOptionByKey(key);
    if (!option) continue;
    matched.push({
      key,
      name: option.name,
      description: option.descriptionTemplate,
      score,
    });
  }

  matched.sort((a, b) => b.score - a.score);
  const topOptions = matched.slice(0, MAX_OPTIONS);

  // Determine body area from top option
  const topOption = topOptions[0];
  const topProcedure = topOption ? getOptionByKey(topOption.key) : undefined;
  const bodyArea = topProcedure?.bodyArea || '기타';

  // Body area detail from the primary symptom's rule
  let bodyAreaDetail = '종합';
  for (const rule of PROCEDURE_RULES) {
    if (rule.preferredOptions.includes(topOption?.key || '')) {
      bodyAreaDetail = rule.rationale.split(' ')[0] || rule.bodyArea;
      break;
    }
  }

  return {
    bodyArea,
    bodyAreaDetail,
    matchedOptions: topOptions,
    ruleVersion: RULE_VERSION,
  };
}

import type { ExtractedTags, RuleMatchResult, MatchedOption } from '../concern-analysis/types';
import { PROCEDURE_RULES } from './procedure-rules';
import { getOptionByKey } from './procedure-options';
import { RULE_VERSION } from './version';

const MAX_OPTIONS = 8; // multi-area (눈+코+턱 등 3부위 이상) 도 각 부위 옵션 확보
const OPTIONAL_TAG_BONUS = 10;

/**
 * Rule-based procedure matching — multi-area support
 *
 * 복수 부위의 증상을 모두 매칭하여
 * 부위별 시술 옵션을 통합 반환
 */
export function matchProcedures(tags: ExtractedTags): RuleMatchResult {
  const allTags = [...tags.symptoms, ...tags.preferences];
  const optionScores = new Map<string, number>();

  for (const rule of PROCEDURE_RULES) {
    const requiredMet = rule.requiredTags.every(rt => allTags.includes(rt));
    if (!requiredMet) continue;

    const excluded = rule.excludedTags.some(et => allTags.includes(et));
    if (excluded) continue;

    let score = rule.priority;
    for (const ot of rule.optionalTags) {
      if (allTags.includes(ot)) score += OPTIONAL_TAG_BONUS;
    }

    for (const optKey of rule.preferredOptions) {
      const existing = optionScores.get(optKey) || 0;
      optionScores.set(optKey, Math.max(existing, score));
    }
  }

  // Build matched options with bodyArea from catalog
  const matched: MatchedOption[] = [];
  for (const [key, score] of optionScores) {
    const option = getOptionByKey(key);
    if (!option) continue;
    matched.push({
      key,
      name: option.name,
      description: option.descriptionTemplate,
      score,
      bodyArea: option.bodyArea,
    });
  }

  matched.sort((a, b) => b.score - a.score);
  const topOptions = matched.slice(0, MAX_OPTIONS);

  // Collect all body areas from matched options
  const areaSet = new Set<string>();
  for (const opt of topOptions) {
    areaSet.add(opt.bodyArea);
  }
  // BodyArea enum key — Stage 3 정렬. 매칭 0건이면 'etc'.
  const bodyAreas = areaSet.size > 0 ? [...areaSet] : ['etc'];
  const primaryArea = bodyAreas[0];

  // FE 가 viewerLocale 기준 라벨 매핑 — bodyAreaDetail 은 enum key 만 join,
  // 표시 라벨은 컴포넌트가 t('common.bodyArea.${key}') 로 생성.
  const bodyAreaDetail = bodyAreas.length > 1
    ? bodyAreas.join('+')
    : primaryArea;

  return {
    bodyAreas,
    primaryArea,
    bodyAreaDetail,
    matchedOptions: topOptions,
    ruleVersion: RULE_VERSION,
  };
}

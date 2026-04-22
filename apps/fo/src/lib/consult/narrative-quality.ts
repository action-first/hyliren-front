/**
 * Narrative quality scoring — language-aware input gate for concern analysis.
 *
 * 목적: character count 기반 검증은 한국어/영어/중국어 사용자를 공평하게 대우하지 못함.
 * - 한자 5자 "我想做双眼皮手术" = semantically rich but char count < 10 → 차단되면 중국 타겟 포기
 * - 이모지 10개 = char count 10 통과 but 의미 0
 *
 * 해결: 문자군별 가중치 점수. CJK 한자=2, 한글=1, 라틴=0.5, 그 외(이모지/공백/숫자/기호)=0.
 * 임계값 10점이면 "我想做双眼皮手术"(16), "눈이 처져서 고민돼요"(10) 통과, "test"(2)·이모지 10개(0) 차단.
 */

export const NARRATIVE_QUALITY_THRESHOLD = 10;

export function narrativeQualityScore(input: string): number {
  let score = 0;
  for (const ch of input) {
    const code = ch.codePointAt(0);
    if (code == null) continue;

    // CJK Unified Ideographs + Extension A + Compatibility Ideographs
    if (
      (code >= 0x4e00 && code <= 0x9fff) ||
      (code >= 0x3400 && code <= 0x4dbf) ||
      (code >= 0xf900 && code <= 0xfaff)
    ) {
      score += 2;
      continue;
    }

    // Hangul syllables
    if (code >= 0xac00 && code <= 0xd7a3) {
      score += 1;
      continue;
    }

    // Latin letters (basic)
    if (
      (code >= 0x0041 && code <= 0x005a) ||
      (code >= 0x0061 && code <= 0x007a)
    ) {
      score += 0.5;
      continue;
    }

    // Everything else (digits, whitespace, punctuation, emoji, symbols) → 0
  }
  return score;
}

export function isNarrativeQualityEnough(input: string): boolean {
  return narrativeQualityScore(input.trim()) >= NARRATIVE_QUALITY_THRESHOLD;
}

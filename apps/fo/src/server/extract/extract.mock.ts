import type { ExtractResult, FeedbackTurn } from '../concern-analysis/types';

/**
 * Mock Extractor — keyword-based tag extraction
 * Deterministic, no LLM cost
 */
export function extractMock(
  narrative: string,
  feedbackTurns: FeedbackTurn[] = [],
): ExtractResult {
  const combined = [
    narrative,
    ...feedbackTurns.filter(t => t.role === 'user').map(t => t.message),
  ].join(' ').toLowerCase();

  const symptoms: string[] = [];
  const preferences: string[] = [];
  const budget: string[] = [];
  const timing: string[] = [];

  /* ── Symptom extraction ── */
  if (combined.includes('처져') || combined.includes('처짐')) symptoms.push('눈꺼풀_처짐');
  if (combined.includes('사나워') || combined.includes('인상') || combined.includes('강해')) symptoms.push('인상_강함');
  if (combined.includes('쌍꺼풀')) symptoms.push('쌍꺼풀_희망');
  if (combined.includes('눈밑') || combined.includes('다크') || combined.includes('피곤해 보')) symptoms.push('눈밑_문제');
  if (combined.includes('코') || combined.includes('콧')) symptoms.push('코_고민');
  if (combined.includes('낮') && (combined.includes('코') || combined.includes('콧'))) symptoms.push('코_낮음');
  if (combined.includes('둥글')) symptoms.push('코끝_둥금');
  if (combined.includes('주름') || combined.includes('팔자')) symptoms.push('주름_깊음');
  if (combined.includes('어려 보이') || combined.includes('동안')) symptoms.push('노화_고민');
  if (combined.includes('피부') || combined.includes('칙칙') || combined.includes('흉터') || combined.includes('모공')) symptoms.push('피부_문제');
  if (combined.includes('얼굴') && (combined.includes('라인') || combined.includes('윤곽'))) symptoms.push('안면윤곽_고민');
  if (combined.includes('지방') || combined.includes('흡입')) symptoms.push('지방_고민');

  /* ── Preference extraction ── */
  if (combined.includes('자연') || combined.includes('티나') || combined.includes('티 나')) preferences.push('자연스러움_선호');
  if (combined.includes('확실') || combined.includes('크게') || combined.includes('화려')) preferences.push('확실한변화_선호');
  if (combined.includes('빠른') || combined.includes('빨리') || combined.includes('회복')) preferences.push('빠른회복_선호');
  if (combined.includes('절개') && (combined.includes('싫') || combined.includes('부담') || combined.includes('아니'))) preferences.push('비절개_선호');

  /* ── Budget extraction ── */
  const wanMatch = combined.match(/(\d+)\s*만?\s*(위안|元|yuan)/i);
  const manMatch = combined.match(/(\d+)\s*만\s*(원|won)?/i);
  if (wanMatch) budget.push(`예산_${wanMatch[1]}만위안`);
  else if (manMatch) budget.push(`예산_${manMatch[1]}만원`);

  /* ── Timing extraction ── */
  const monthMatch = combined.match(/(\d{1,2})\s*월/);
  if (monthMatch) timing.push(`방문_${monthMatch[1]}월`);

  /* ── Fallbacks ── */
  if (symptoms.length === 0) symptoms.push('미분류_고민');
  if (preferences.length === 0) preferences.push('자연스러움_선호');

  /* ── Build summary ── */
  const bodyAreaMap: Record<string, { area: string; detail: string }> = {
    '눈꺼풀_처짐': { area: '눈', detail: '눈매교정' },
    '인상_강함': { area: '눈', detail: '눈매교정' },
    '쌍꺼풀_희망': { area: '눈', detail: '쌍꺼풀' },
    '눈밑_문제': { area: '눈', detail: '눈밑' },
    '코_고민': { area: '코', detail: '코 종합' },
    '코_낮음': { area: '코', detail: '콧대' },
    '코끝_둥금': { area: '코', detail: '코끝 성형' },
    '주름_깊음': { area: '리프팅', detail: '주름 개선' },
    '노화_고민': { area: '리프팅', detail: '동안' },
    '피부_문제': { area: '피부', detail: '피부 관리' },
    '안면윤곽_고민': { area: '리프팅', detail: '안면윤곽' },
    '지방_고민': { area: '다이어트', detail: '지방흡입' },
  };

  // Collect ALL body areas from symptoms (multi-area support)
  const areaSet = new Set<string>();
  const details: string[] = [];
  for (const s of symptoms) {
    const info = bodyAreaMap[s];
    if (info) {
      areaSet.add(info.area);
      if (!details.includes(info.detail)) details.push(info.detail);
    }
  }
  const bodyAreas = areaSet.size > 0 ? [...areaSet] : ['기타'];
  const primaryArea = bodyAreas[0];
  const bodyAreaDetail = details.length > 1 ? details.join('+') + ' 복합' : details[0] || '종합';

  let desiredOutcome = '자연스러운 개선';
  if (preferences.includes('확실한변화_선호')) desiredOutcome = '확실한 변화';
  if (preferences.includes('비절개_선호')) desiredOutcome = '비절개 위주 자연스러운 개선';

  let budgetMax: number | null = null;
  if (budget[0]) {
    const numMatch = budget[0].match(/(\d+)/);
    if (numMatch) {
      budgetMax = parseInt(numMatch[1], 10);
      if (budget[0].includes('위안')) budgetMax = budgetMax * 10000;
    }
  }

  let visitDate: string | null = null;
  if (timing[0]) {
    const m = timing[0].match(/(\d+)/);
    if (m) visitDate = `2026-${m[1].padStart(2, '0')}`;
  }

  return {
    tags: { symptoms, preferences, budget, timing },
    summary: {
      bodyAreas,
      primaryArea,
      bodyAreaDetail,
      desiredOutcome,
      budgetMax,
      visitDate,
    },
  };
}

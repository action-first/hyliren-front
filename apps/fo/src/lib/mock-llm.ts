import type { AISummary } from '@/store/consult';

/**
 * Mock LLM — 자연어 고민 입력 → 구조화된 요약
 * 실제 구현 시 AI SDK + Claude/GPT로 교체
 */
export async function analyzeConcern(text: string, _photoCount: number): Promise<AISummary> {
  // Simulate network delay
  await new Promise(r => setTimeout(r, 1800));

  const lower = text.toLowerCase();

  // Simple keyword-based classification (mock)
  let bodyArea = '기타';
  let bodyAreaDetail = '';
  let intent = '자연스러움';
  let riskPreference = 'low';
  const keywords: string[] = [];

  if (lower.includes('눈') || lower.includes('쌍꺼풀') || lower.includes('눈매')) {
    bodyArea = '눈';
    if (lower.includes('쌍꺼풀')) { bodyAreaDetail = '매몰쌍꺼풀'; keywords.push('쌍꺼풀'); }
    if (lower.includes('눈매')) { bodyAreaDetail = '눈매교정'; keywords.push('눈매교정'); }
    if (lower.includes('눈밑')) { bodyAreaDetail = '눈밑지방 재배치'; keywords.push('눈밑'); }
  } else if (lower.includes('코') || lower.includes('콧')) {
    bodyArea = '코';
    if (lower.includes('코끝')) { bodyAreaDetail = '코끝 성형'; keywords.push('코끝'); }
    if (lower.includes('콧대')) { bodyAreaDetail = '콧대 성형'; keywords.push('콧대'); }
    keywords.push('코성형');
  } else if (lower.includes('리프팅') || lower.includes('주름') || lower.includes('처짐') || lower.includes('팔자')) {
    bodyArea = '리프팅';
    if (lower.includes('실')) { bodyAreaDetail = '실리프팅'; keywords.push('실리프팅'); }
    if (lower.includes('울쎄라')) { bodyAreaDetail = '울쎄라'; keywords.push('울쎄라'); }
    keywords.push('리프팅');
  } else if (lower.includes('피부') || lower.includes('흉터') || lower.includes('여드름') || lower.includes('모공')) {
    bodyArea = '피부';
    if (lower.includes('흉터')) { bodyAreaDetail = '흉터 치료'; keywords.push('흉터'); }
    if (lower.includes('모공')) { bodyAreaDetail = '모공 관리'; keywords.push('모공'); }
    keywords.push('피부관리');
  } else if (lower.includes('지방') || lower.includes('다이어트') || lower.includes('흡입')) {
    bodyArea = '다이어트';
    bodyAreaDetail = '지방흡입';
    keywords.push('지방흡입');
  }

  if (lower.includes('자연') || lower.includes('티') || lower.includes('티나')) {
    intent = '자연스러움';
    keywords.push('자연스러움');
  } else if (lower.includes('확실') || lower.includes('크게') || lower.includes('화려')) {
    intent = '확실한 변화';
    keywords.push('확실한변화');
  }

  if (lower.includes('빨리') || lower.includes('빠른') || lower.includes('회복')) {
    riskPreference = 'low';
    keywords.push('빠른회복');
  }

  let budgetEstimate: number | null = null;
  const budgetMatch = text.match(/(\d+)\s*만/);
  if (budgetMatch) {
    budgetEstimate = parseInt(budgetMatch[1], 10);
  }

  return {
    bodyArea,
    bodyAreaDetail: bodyAreaDetail || bodyArea,
    intent,
    budgetEstimate,
    riskPreference,
    keywords: keywords.length > 0 ? keywords : [bodyArea],
  };
}

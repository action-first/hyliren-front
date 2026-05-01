import type { ExtractResult, FeedbackTurn } from '../concern-analysis/types';

type SourceLocale = 'ko' | 'zh-CN' | 'ja' | 'en';

/**
 * Mock Extractor — keyword-based tag extraction
 * Deterministic, no LLM cost
 *
 * sourceLocale: narrative 가 작성된 언어. 현재 ko 사전만 구현 — 다른 locale 은
 * 콘텐츠 다국어 트랙 (자동 번역/LLM 도입) 에서 사전 추가 예정.
 * ko 외 locale 입력은 매칭 0 → 결과 fallback tag (`'미분류_고민'`) 으로 처리됨.
 */
export function extractMock(
  narrative: string,
  feedbackTurns: FeedbackTurn[] = [],
  sourceLocale: SourceLocale = 'ko',
): ExtractResult {
  // 현재 mock 은 ko 사전만 — 다른 locale narrative 는 매칭 못 하지만 시그니처는 정렬됨.
  // Future: locale 별 KEYWORD_DICT[sourceLocale] 분기.
  void sourceLocale;

  const combined = [
    narrative,
    ...feedbackTurns.filter(t => t.role === 'user').map(t => t.message),
  ].join(' ').toLowerCase();

  const symptoms: string[] = [];
  const preferences: string[] = [];
  const budget: string[] = [];
  const timing: string[] = [];

  /* ══════════════════════════════════════════════════════════════
     Symptom extraction — 상담실장 관점의 환자 언어 → 내부 tag 매핑
     환자가 실제로 쓰는 구어 표현을 폭넓게 잡되, rule engine 이
     이해하는 기존 tag 셋으로만 귀결시킨다 (새 tag 추가 시 rule/option
     업데이트 필요하므로 현재 catalog 유지).
     ══════════════════════════════════════════════════════════════ */

  const hasAny = (...kws: string[]) => kws.some(k => combined.includes(k));

  /* ── 눈: 쌍꺼풀 (작은 눈·홑꺼풀·쌍꺼풀 희망) ── */
  if (
    hasAny(
      '쌍꺼풀', '쌍커풀', '쌍까풀',
      '홑눈', '홑꺼풀', '무쌍',
      '짝눈',
    ) ||
    (combined.includes('눈') && hasAny('작', '짝', '또렷', '크게 뜨', '커 보이', '흐리멍', '두꺼운 눈')) ||
    (combined.includes('눈매') && hasAny('또렷', '크', '선명'))
  ) symptoms.push('쌍꺼풀_희망');

  /* ── 눈: 눈매교정·눈 뜨는 힘 (처짐·답답·졸려 보임) ── */
  if (
    hasAny(
      '처져', '처짐', '처진 눈',
      '답답', '무거워', '무거운 눈',
      '졸려 보', '졸린 눈', '피곤해 보', '피곤하게',
      '풀린', '풀려', '흐리멍',
      '눈꺼풀', '안검하수',
    )
  ) symptoms.push('눈꺼풀_처짐');

  /* ── 눈: 인상 (사나움·날카로움) ── */
  if (
    hasAny('사나워', '사나운', '인상 강', '인상이 강', '날카로', '매서', '차가워 보', '쎄 보', '독해 보')
  ) symptoms.push('인상_강함');

  /* ── 눈: 눈밑 (다크서클·애교살·지방) ── */
  if (
    hasAny(
      '눈밑', '눈 밑',
      '다크서클', '다크',
      '애교살',
      '지친 인상', '피곤해 보', '나이 들어 보',
      '꺼진', '눈 꺼짐', '움푹',
    )
  ) symptoms.push('눈밑_문제');

  /* ── 코: 종합 상담 (코 관련 발화면 최소 종합 상담 tag) ── */
  if (
    hasAny(
      '코', '콧', '비성형', '비수술', '비중격',
      '매부리', '휜 코', '비뚤', '들창',
      '복코', '주먹코', '납작', '뭉툭',
      '콧대', '콧등', '콧볼', '코끝', '코 길',
    )
  ) symptoms.push('코_고민');

  /* ── 코: 낮음/꺼짐 → 콧대 개선 ── */
  if (
    hasAny(
      '코 낮', '코가 낮', '코가 너무 낮', '낮은 코',
      '납작', '저코',
      '콧대 낮', '콧대가 낮',
      '볼륨 없', '꺼진 콧등',
    ) ||
    (combined.includes('낮') && hasAny('코', '콧'))
  ) symptoms.push('코_낮음');

  /* ── 코: 코끝 (둥근·뭉툭·주먹코) ── */
  if (
    hasAny(
      '코끝', '코 끝',
      '둥글', '동글', '뭉툭', '주먹코', '복코',
      '매부리',
    )
  ) symptoms.push('코끝_둥금');

  /* ── 리프팅: 주름 (팔자·미간·이마·잔주름) ── */
  if (
    hasAny(
      '주름', '팔자', '팔자주름', '팔자 주름',
      '미간', '이마 주름', '눈가 주름', '눈가주름',
      '목주름', '입가 주름', '입가주름', '심술턱',
      '잔주름', '깊어',
    )
  ) symptoms.push('주름_깊음');

  /* ── 리프팅: 안티에이징 (동안·탄력·나이 들어 보임) ── */
  if (
    hasAny(
      '어려 보이', '동안', '젊어 보',
      '늙어 보', '나이 들어 보', '노안', '나이가 들어',
      '탄력', '탄력 없', '처진 얼굴', '리프팅', '탱탱',
      '볼살 빠', '관자놀이 꺼', '이마 꺼',
    )
  ) symptoms.push('노화_고민');

  /* ── 리프팅/안면윤곽: 턱·광대·얼굴 윤곽 ── */
  if (
    hasAny(
      '주걱턱', '양악', '무턱', '사각턱',
      '안면윤곽', '안면 윤곽',
      '광대', '광대뼈', '돌출',
      '턱선', '턱 끝', '턱끝', '심미턱',
      'V라인', 'v라인', '브이라인', '갸름',
      '이중턱', '이중 턱', '이중턱살',
      '얼굴 커', '얼굴이 커', '얼굴이 크', '얼굴이 넓', '얼굴이 길',
    ) ||
    (combined.includes('얼굴') && hasAny('라인', '윤곽', '작게'))
  ) symptoms.push('안면윤곽_고민');

  /* ── 피부 (톤·흉터·모공·여드름·기미) ── */
  if (
    hasAny(
      '피부',
      '칙칙', '톤 어두', '어두운 피부', '홍조', '붉은 기', '붉어',
      '흉터', '여드름', '여드름 자국', '자국', '흔적',
      '모공', '피지', '블랙헤드',
      '기미', '잡티', '색소', '주근깨',
      '트러블', '각질', '건조', '유분', '지성', '번들',
      '당김', '갈라', '탁한',
    )
  ) symptoms.push('피부_문제');

  /* ── 다이어트 (지방·셀룰라이트·부분비만) ── */
  if (
    hasAny(
      '지방', '지방흡입', '흡입',
      '살찐', '살이 많', '통통', '비만', '뚱뚱',
      '뱃살', '복부', '허리', '옆구리', '러브핸들',
      '허벅지', '승마살', '하체', '종아리',
      '팔뚝', '부위 살',
      '셀룰라이트',
    )
  ) symptoms.push('지방_고민');

  /* ══════════════════════════════════════════════════════════════
     Preference extraction — 선호·제약
     ══════════════════════════════════════════════════════════════ */

  /* 자연스러움 선호 — 과하지 않게, 티 안 나게 */
  if (
    hasAny(
      '자연', '티나지', '티 나지', '티 안',
      '은은', '과하지 않', '심하지 않',
      '드라마틱하지 않', '티 안 나', '부담 없',
    )
  ) preferences.push('자연스러움_선호');

  /* 확실한 변화 선호 — 뚜렷·화려·크게 */
  if (
    hasAny(
      '확실', '뚜렷', '드라마틱',
      '크게', '화려', '시원',
      '많이 바꾸', '확 바꾸', '완전히',
    )
  ) preferences.push('확실한변화_선호');

  /* 빠른 회복 선호 — 일상 복귀 급한 상황 */
  if (
    hasAny(
      '빠른 회복', '빨리 회복', '회복 빨', '회복이 빠',
      '금방', '금세', '다운타임', '출근',
      '휴가', '휴학', '바쁘', '일정',
      '학기', '개강', '방학',
    )
  ) preferences.push('빠른회복_선호');

  /* 비절개 선호 — 메스·흉터·통증 부담 */
  if (
    (combined.includes('절개') && hasAny('싫', '부담', '아니', '무서', '안 하')) ||
    hasAny(
      '수술 무서', '메스 무서', '메스 싫',
      '흉터 걱정', '흉터 남',
      '비침습', '비절개', '레이저로', '실로', '간단한',
    )
  ) preferences.push('비절개_선호');

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

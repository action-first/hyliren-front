import type { ExtractedTags, RuleMatchResult, GeneratedGuide, FeedbackTurn } from '../concern-analysis/types';

const DISCLAIMER = '정확한 적용 여부는 실제 병원의 상담과 진단을 통해 결정됩니다.';

/* ── Empathy templates ── */
const EMPATHY: Record<string, Record<string, string>> = {
  '눈': {
    '눈매교정': '눈매 때문에 인상이 강하게 보이거나 피곤해 보이는 점이 고민이셨군요. 많은 분들이 같은 이유로 상담을 시작하십니다.',
    '쌍꺼풀': '자연스러운 쌍꺼풀 라인을 원하시는 마음, 충분히 이해합니다. 아시아권 고객분들이 가장 많이 상담하시는 고민이에요.',
    '눈밑': '눈밑이 꺼지거나 지방이 튀어나오면 실제보다 훨씬 피곤하고 나이 들어 보일 수 있어요. 공감합니다.',
  },
  '코': {
    _default: '코 모양 때문에 전체 얼굴 밸런스가 아쉬우셨군요. 코는 얼굴 인상에 가장 큰 영향을 미치는 부위 중 하나입니다.',
  },
  '리프팅': {
    _default: '나이가 들면서 얼굴 라인이 변하는 건 자연스러운 과정이에요. 하지만 본인이 느끼는 스트레스는 충분히 이해합니다.',
  },
  '피부': {
    _default: '피부 컨디션은 자신감과 직결되는 부분이죠. 고민하시는 마음 충분히 공감합니다.',
  },
};

/* ── Education templates ── */
const EDUCATION: Record<string, Record<string, string>> = {
  '눈': {
    '눈매교정': '한국에서는 비절개 눈매교정이나 이마 거상술을 통해 자연스럽게 인상을 부드럽게 만드는 접근을 많이 고려합니다. 중요한 건 무조건 큰 변화를 주는 게 아니라, 현재 눈매의 구조에 맞는 방법을 찾는 것이에요.',
    '쌍꺼풀': '매몰법은 회복이 빠르고 자연스러운 반면, 절개법은 더 뚜렷하고 오래 유지됩니다. 피부 두께와 지방량에 따라 적합한 방법이 달라지므로, 여러 병원의 의견을 비교해 보시는 것을 권합니다.',
    '눈밑': '눈밑지방 재배치는 지방을 제거하는 게 아니라 고르게 펴주는 시술이에요. 다크서클과 꺼짐을 동시에 개선할 수 있으며, 일반적으로 회복이 비교적 빠른 편입니다.',
  },
  '코': {
    _default: '코성형은 높이만 올리는 게 아니라, 코끝의 모양과 콧대의 라인을 함께 조절해야 자연스럽습니다. 한국에서는 자가 연골을 활용한 자연스러운 코성형이 일반적으로 많이 고려됩니다.',
  },
  '리프팅': {
    _default: '실리프팅은 절개 없이 리프팅 효과를 주고 회복이 빠른 장점이 있어요. 울쎄라 같은 초음파 리프팅은 비침습적이면서 피부 탄력을 개선합니다. 처짐 정도에 따라 적합한 방법이 달라질 수 있습니다.',
  },
  '피부': {
    _default: '한국의 피부과는 레이저, 필링, 재생 치료 등 다양한 옵션을 복합적으로 활용합니다. 피부 타입과 고민에 맞는 맞춤 프로토콜이 일반적으로 중요하게 고려됩니다.',
  },
};

export function generateMock(
  _narrative: string,
  _tags: ExtractedTags,
  ruleResult: RuleMatchResult,
  feedbackTurns: FeedbackTurn[] = [],
): GeneratedGuide {
  const area = ruleResult.bodyArea;
  const detail = ruleResult.bodyAreaDetail;

  // Empathy
  let empathy = EMPATHY[area]?.[detail]
    || EMPATHY[area]?._default
    || '고민을 나눠주셔서 감사해요. 어떤 변화를 원하시는지 충분히 이해했습니다.';

  // Education
  let education = EDUCATION[area]?.[detail]
    || EDUCATION[area]?._default
    || '한국은 다양한 미용 시술 분야에서 세계적인 수준을 갖추고 있어요. 고객님의 상황에 맞는 최적의 방법을 찾는 것이 일반적으로 가장 중요하게 고려됩니다.';

  // Apply feedback refinements
  const userFeedback = feedbackTurns
    .filter(t => t.role === 'user')
    .map(t => t.message.toLowerCase())
    .join(' ');

  if (userFeedback.includes('절개') && (userFeedback.includes('부담') || userFeedback.includes('싫'))) {
    education += ' 비절개 방식 위주로 정리해 드릴게요.';
  }
  if (userFeedback.includes('회복') && (userFeedback.includes('짧') || userFeedback.includes('빠'))) {
    education += ' 회복이 빠른 옵션을 우선적으로 안내해 드립니다.';
  }

  // Options from rule result
  const options = ruleResult.matchedOptions.map(opt => ({
    key: opt.key,
    name: opt.name,
    description: opt.description,
  }));

  return {
    empathy,
    education,
    options,
    disclaimer: DISCLAIMER,
  };
}

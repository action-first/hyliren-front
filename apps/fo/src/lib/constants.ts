/**
 * FO Shared Constants
 * 페이지 간 복붙 방지 — single source of truth
 */

/** 병원별 value proposition */
export const VALUE_PROPS: Record<string, string> = {
  'm-001': '자연스러운 눈매 전문 · 15년 경력',
  'm-002': '날렵한 코 라인 전문',
  'm-003': '프리미엄 리프팅 · 안면윤곽 전문',
  'm-004': '피부 시술 + 리프팅 복합 케어',
};

/** 카드 커버 그라디언트 */
export const CARD_GRADIENTS = [
  'from-[#fce4ec] via-[#f3e5f5] to-[#e8eaf6]',
  'from-[#e0f2f1] via-[#e8f5e9] to-[#f1f8e9]',
  'from-[#fff3e0] via-[#fbe9e7] to-[#fce4ec]',
  'from-[#e3f2fd] via-[#e8eaf6] to-[#ede7f6]',
] as const;

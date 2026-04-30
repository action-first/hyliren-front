// FO — 부위별 스타일 상수 (Tailwind 클래스)
// 키는 BodyArea enum (eyes/nose/lifting/skin/diet/etc) — i18n QA Stage 3 정렬.

/** 부위별 뱃지 스타일 (bg + text) */
export const AREA_ACCENT: Record<string, string> = {
  eyes:    'bg-blue-50 text-blue-600',
  nose:    'bg-pink-50 text-pink-600',
  lifting: 'bg-purple-50 text-purple-600',
  skin:    'bg-emerald-50 text-emerald-600',
  diet:    'bg-amber-50 text-amber-600',
  etc:     'bg-gray-50 text-gray-600',
};

/** 부위별 악센트 바 색상 (bg only) */
export const AREA_BAR: Record<string, string> = {
  eyes:    'bg-blue-400',
  nose:    'bg-pink-400',
  lifting: 'bg-purple-400',
  skin:    'bg-emerald-400',
  diet:    'bg-amber-400',
  etc:     'bg-gray-400',
};

/** 부위 바 색상 가져오기 (fallback 포함) */
export function getAreaBar(area: string): string {
  return AREA_BAR[area] || 'bg-gray-300';
}

/** 부위 뱃지 클래스 가져오기 (fallback 포함) */
export function getAreaAccent(area: string): string {
  return AREA_ACCENT[area] || 'bg-gray-50 text-gray-600';
}

// FO — 부위별 스타일 상수 (Tailwind 클래스)
// 모든 FO 페이지에서 단일 소스로 참조

/** 부위별 뱃지 스타일 (bg + text) */
export const AREA_ACCENT: Record<string, string> = {
  '눈':       'bg-blue-50 text-blue-600',
  '코':       'bg-pink-50 text-pink-600',
  '리프팅':   'bg-purple-50 text-purple-600',
  '피부':     'bg-emerald-50 text-emerald-600',
  '다이어트': 'bg-amber-50 text-amber-600',
  '기타':     'bg-gray-50 text-gray-600',
};

/** 부위별 악센트 바 색상 (bg only) */
export const AREA_BAR: Record<string, string> = {
  '눈':       'bg-blue-400',
  '코':       'bg-pink-400',
  '리프팅':   'bg-purple-400',
  '피부':     'bg-emerald-400',
  '다이어트': 'bg-amber-400',
  '기타':     'bg-gray-400',
};

/** 부위 바 색상 가져오기 (fallback 포함) */
export function getAreaBar(area: string): string {
  return AREA_BAR[area] || 'bg-gray-300';
}

/** 부위 뱃지 클래스 가져오기 (fallback 포함) */
export function getAreaAccent(area: string): string {
  return AREA_ACCENT[area] || 'bg-gray-50 text-gray-600';
}

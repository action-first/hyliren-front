// ============================================================
// HYLIREN — 공통 AG Grid 셀 렌더러
// BO/PO 리스트 페이지에서 재사용하는 cellRenderer 팩토리 함수
// ============================================================

interface BadgeColor { bg: string; text: string; }

/**
 * 뱃지 셀 렌더러 — 값에 따라 색상이 다른 라운드 뱃지
 * @param colorMap  값 → { bg, text } 매핑
 * @param fallback  매핑에 없을 때 기본 색상
 */
export function badgeCellRenderer(
  colorMap: Record<string, BadgeColor>,
  fallback: BadgeColor = { bg: '#f3f4f6', text: '#374151' },
) {
  return (p: { value: string }) => {
    const c = colorMap[p.value] || fallback;
    return `<span style="display:inline-block;padding:2px 8px;border-radius:4px;font-size:12px;font-weight:500;background:${c.bg};color:${c.text}">${p.value}</span>`;
  };
}

/**
 * 카운트 뱃지 셀 렌더러 — 0이면 "미발송", 1이상이면 "N건 발송" 등
 * @param unit  단위 (예: '건')
 * @param suffix  접미사 (예: '발송')
 * @param emptyLabel  0일 때 표시 텍스트
 */
export function countBadgeCellRenderer(
  unit = '건',
  suffix = '발송',
  emptyLabel = '미발송',
) {
  return (p: { value: number }) => {
    if (p.value > 0) {
      return `<span style="display:inline-block;padding:2px 8px;border-radius:4px;font-size:11px;font-weight:600;background:#dcfce7;color:#166534">${p.value}${unit} ${suffix}</span>`;
    }
    return `<span style="font-size:12px;color:#d1d5db">${emptyLabel}</span>`;
  };
}

/**
 * 액션 링크 셀 렌더러 — 상세/제안 등 링크 버튼 생성
 * @param links  { label, href(data) } 배열
 */
export function actionCellRenderer<T extends { id: string }>(
  links: { label: string; href: (data: T) => string; primary?: boolean }[],
  accentColor = '#2C6ECB',
) {
  return (p: { data: T | undefined }) => {
    if (!p.data) return '';
    const items = links.map(link => {
      const color = link.primary ? accentColor : '#9ca3af';
      const weight = link.primary ? '600' : '500';
      return `<a href="${link.href(p.data!)}" style="color:${color};font-size:12px;font-weight:${weight};text-decoration:none;">${link.label}</a>`;
    });
    return `<span style="display:flex;gap:10px;align-items:center;height:100%">${items.join('')}</span>`;
  };
}

/**
 * 단순 텍스트 링크 렌더러 — "상세" 한 개짜리
 * @param basePath  기본 경로 (예: '/buyers')
 * @param label  링크 텍스트 (기본: '상세')
 */
export function detailLinkRenderer<T extends { id: string }>(
  basePath: string,
  label = '상세',
  accentColor = '#2C6ECB',
) {
  return (p: { data: T | undefined }) => {
    if (!p.data) return '';
    return `<a href="${basePath}/${p.data.id}" style="color:${accentColor};font-size:12px;font-weight:500;text-decoration:none;">${label}</a>`;
  };
}

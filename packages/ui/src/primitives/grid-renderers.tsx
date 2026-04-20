// ============================================================
// HYLIREN — AG Grid 셀 렌더러 디자인 시스템
//
// 사용 원칙:
// 1. 한 행에 뱃지(badgeCellRenderer) 최대 1개 — 상태 컬럼만
// 2. 부위/카테고리/유형 → dotTextRenderer (dot + 텍스트)
// 3. 숫자/날짜 → 뱃지 사용 금지, cellStyle로 처리
// 4. 카운트 → countBadgeCellRenderer (특수 케이스만)
// ============================================================

import React from 'react';

interface BadgeColor { bg: string; text: string; }

// ── 디자인 토큰 ──
const BADGE_TOKEN = {
  height: 22,
  paddingH: 8,
  paddingV: 2,
  fontSize: 12,
  fontWeight: 500,
  radius: 4,
} as const;

/**
 * 상태 뱃지 렌더러 — 한 행에 1개만 사용
 * 용도: 상태(접수됨/발송/열람), 인증(인증/미인증) 등 시맨틱 상태 표시
 */
export function badgeCellRenderer(
  colorMap: Record<string, BadgeColor>,
  fallback: BadgeColor = { bg: '#f3f4f6', text: '#374151' },
) {
  return (p: { value: string }) => {
    if (!p.value) return null;
    const c = colorMap[p.value] || fallback;
    return (
      <span style={{
        display: 'inline-flex', alignItems: 'center',
        height: BADGE_TOKEN.height,
        padding: `${BADGE_TOKEN.paddingV}px ${BADGE_TOKEN.paddingH}px`,
        borderRadius: BADGE_TOKEN.radius,
        fontSize: BADGE_TOKEN.fontSize, fontWeight: BADGE_TOKEN.fontWeight,
        background: c.bg, color: c.text,
        lineHeight: 1,
      }}>{p.value}</span>
    );
  };
}

/**
 * dot + 텍스트 렌더러 — 부위/카테고리/유형 등 경량 표시
 * 뱃지보다 시각적 무게가 낮아서 크리스마스 트리 방지
 */
export function dotTextRenderer(
  colorMap: Record<string, string>,
  fallbackColor = '#94a3b8',
) {
  return (p: { value: string }) => {
    if (!p.value) return null;
    const dotColor = colorMap[p.value] || fallbackColor;
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
        <span style={{
          width: 7, height: 7, borderRadius: '50%',
          background: dotColor, flexShrink: 0,
        }} />
        <span style={{ fontSize: 13, color: '#374151' }}>{p.value}</span>
      </span>
    );
  };
}

/**
 * 카운트 표시 렌더러 — "N건 발송" / "미발송"
 */
export function countBadgeCellRenderer(
  unit = '건',
  suffix = '발송',
  emptyLabel = '미발송',
) {
  return (p: { value: number }) => {
    if (p.value > 0) {
      return (
        <span style={{
          fontSize: 12, fontWeight: 600, color: '#166534',
        }}>{p.value}{unit} {suffix}</span>
      );
    }
    return <span style={{ fontSize: 12, color: '#d1d5db' }}>{emptyLabel}</span>;
  };
}

/**
 * 액션 링크 렌더러 — 상세/제안 등
 */
export function actionCellRenderer<T extends { id: string }>(
  links: { label: string; href: (data: T) => string; primary?: boolean }[],
  accentColor = '#2C6ECB',
) {
  return (p: { data: T | undefined }) => {
    if (!p.data) return null;
    return (
      <span style={{ display: 'flex', gap: 10, alignItems: 'center', height: '100%' }}>
        {links.map(link => (
          <a key={link.label} href={link.href(p.data!)} style={{
            color: link.primary ? accentColor : '#9ca3af',
            fontSize: 12, fontWeight: link.primary ? 600 : 500,
            textDecoration: 'none',
          }}>{link.label}</a>
        ))}
      </span>
    );
  };
}

/**
 * 단순 링크 렌더러 — "상세" 한 개
 */
export function detailLinkRenderer<T extends { id: string }>(
  basePath: string,
  label = '상세',
  accentColor = '#2C6ECB',
) {
  return (p: { data: T | undefined }) => {
    if (!p.data) return null;
    return (
      <a href={`${basePath}/${p.data.id}`} style={{
        color: accentColor, fontSize: 12, fontWeight: 500, textDecoration: 'none',
      }}>{label}</a>
    );
  };
}

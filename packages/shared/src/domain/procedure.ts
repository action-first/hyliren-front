import type {
  Procedure, ProcedureVariant,
} from '../types/procedure';
import type { Locale, AnesthesiaType } from '../constants';
import { LOCALES } from '../constants';

/* ══════════════════════════════════════════════════════════════
   Variant — base 승계 · 가격 집계
   ══════════════════════════════════════════════════════════════ */

/**
 * variant 의 숫자 override 필드가 null 이면 procedure.base* 승계.
 * FO 렌더 · 카드 가격 표시에 쓸 "effective" 값 머지.
 */
export function getEffectiveVariant(
  variant: ProcedureVariant,
  procedure: Pick<
    Procedure,
    'basePrice' | 'baseAnesthesia' | 'baseDurationMinutes'
    | 'baseRecoveryDays' | 'baseHospitalStayDays'
  >,
): {
  price: number;
  anesthesia: AnesthesiaType;
  durationMinutes: number;
  recoveryDays: number;
  hospitalStayDays: number;
} {
  return {
    price: variant.price ?? procedure.basePrice,
    anesthesia: variant.anesthesia ?? procedure.baseAnesthesia,
    durationMinutes: variant.durationMinutes ?? procedure.baseDurationMinutes,
    recoveryDays: variant.recoveryDays ?? procedure.baseRecoveryDays,
    hospitalStayDays: variant.hospitalStayDays ?? procedure.baseHospitalStayDays,
  };
}

/**
 * variants 의 effective price 로 procedure.priceMin / priceMax 재계산.
 * variants 가 비어 있으면 basePrice 단일값.
 */
export function computePriceRange(
  variants: ProcedureVariant[],
  procedure: Pick<Procedure, 'basePrice'>,
): { priceMin: number; priceMax: number } {
  if (variants.length === 0) {
    return { priceMin: procedure.basePrice, priceMax: procedure.basePrice };
  }
  const prices = variants.map(v => v.price ?? procedure.basePrice);
  return { priceMin: Math.min(...prices), priceMax: Math.max(...prices) };
}

/* ══════════════════════════════════════════════════════════════
   i18n — locale 픽 · fallback (빈 문자열 노출 방지)
   ══════════════════════════════════════════════════════════════ */

/**
 * i18n 객체에서 target locale 블럭을 찾되 없으면 source 로 fallback.
 * 빈 문자열 노출 방지 — 확정안 "무중단 Fallback 정책".
 *
 * 모든 번역 콘텐츠(Procedure, Variant) 에 동일하게 적용되는 유일한 i18n 유틸.
 */
export function pickI18n<T>(
  i18n: Partial<Record<Locale, T>>,
  target: Locale,
  source: Locale,
): { content: T; fallback: boolean } | null {
  const hit = i18n[target];
  if (hit !== undefined) return { content: hit, fallback: false };
  const src = i18n[source];
  if (src !== undefined) return { content: src, fallback: true };
  return null;
}

/* ══════════════════════════════════════════════════════════════
   Request locale resolver — 확정안 4번 우선순위
   1. ?locale=xxx
   2. Accept-Language 헤더
   3. DEFAULT (ko)
   ══════════════════════════════════════════════════════════════ */

/**
 * "ko-KR,ko;q=0.9,en-US;q=0.8,zh-CN;q=0.6" 같은 헤더에서 LOCALES 매칭 언어 찾기.
 * 베이스 언어(en-US → en) 까지 fallback 검색. 단 zh-CN ↔ zh-TW 는 매칭 안 함 (간체·번체 구분).
 */
export function parseAcceptLanguage(header: string): Locale | null {
  const parts = header.split(',').map(p => {
    const [tag, ...params] = p.trim().split(';');
    const qParam = params.find(x => x.trim().startsWith('q='));
    const q = qParam ? parseFloat(qParam.split('=')[1]) : 1.0;
    return { tag: tag.trim(), q };
  });
  parts.sort((a, b) => b.q - a.q);

  const locales = LOCALES as readonly string[];
  for (const { tag } of parts) {
    if (locales.includes(tag)) return tag as Locale;
    const base = tag.split('-')[0];
    if (base !== tag && locales.includes(base)) return base as Locale;
  }
  return null;
}

/** 확정안 우선순위대로 locale 결정. FO route handler 진입점에서 호출. */
export function resolveRequestLocale(
  queryLocale: string | null,
  acceptLanguage: string | null,
  defaultLocale: Locale = 'ko',
): Locale {
  if (queryLocale && (LOCALES as readonly string[]).includes(queryLocale)) {
    return queryLocale as Locale;
  }
  if (acceptLanguage) {
    const parsed = parseAcceptLanguage(acceptLanguage);
    if (parsed) return parsed;
  }
  return defaultLocale;
}

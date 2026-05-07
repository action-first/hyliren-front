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
 *
 * Pick 으로 받아 PO wizard 의 WizardVariant (procedureId/timestamps 없는 편집 상태)
 * 도 캐스팅 없이 통과하도록 한다.
 */
export function getEffectiveVariant(
  variant: Pick<
    ProcedureVariant,
    'price' | 'anesthesia' | 'durationMinutes' | 'recoveryDays' | 'hospitalStayDays'
  >,
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
  variants: Array<Pick<ProcedureVariant, 'price'>>,
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
 * Accept-Language 헤더 파서. RFC 7231 §5.3.5 부분 구현.
 * BE `libs/common/src/i18n/resolve-locale.util.ts` 와 동일한 정책으로 일치:
 *   - q-value 우선순위 정렬 (동률은 입력 순서 유지)
 *   - q=0 항목은 명시적 비선호 → skip
 *   - 매칭 순서: exact LOCALE → base lang → prefix family
 *     prefix family: zh-* → zh-CN, ja-* → ja, en-* → en, ko-* → ko
 *   - 예: `Accept-Language: zh;q=1, en;q=0.9` → zh-CN
 *   - 예: `ko-KR,ko;q=0.9,en-US;q=0.8,zh-CN;q=0.6` → ko
 */
export function parseAcceptLanguage(header: string): Locale | null {
  const items: { tag: string; q: number; idx: number }[] = [];
  header.split(',').forEach((raw, idx) => {
    const [tag, ...params] = raw.trim().split(';').map(s => s.trim());
    if (!tag) return;
    let q = 1;
    for (const p of params) {
      const m = /^q\s*=\s*([0-9.]+)$/i.exec(p);
      if (m) {
        const parsed = Number(m[1]);
        if (Number.isFinite(parsed)) q = parsed;
      }
    }
    if (q <= 0) return; // q=0 명시적 비선호
    items.push({ tag: tag.toLowerCase(), q, idx });
  });
  items.sort((a, b) => (b.q - a.q) || (a.idx - b.idx));

  const locales = LOCALES as readonly string[];
  for (const { tag } of items) {
    // 1) exact LOCALE 매칭 ('zh-cn' → 'zh-CN' lower-case 비교 위해 normalize)
    const exactMatch = locales.find(l => l.toLowerCase() === tag);
    if (exactMatch) return exactMatch as Locale;
    // 2) base lang 매칭 (en-us → en, ja-jp → ja, ko-kr → ko)
    const base = tag.split('-')[0];
    const baseMatch = locales.find(l => l.toLowerCase() === base);
    if (baseMatch) return baseMatch as Locale;
    // 3) prefix family — BE resolveLocale 와 동일한 zh-* → zh-CN 매핑
    if (base === 'zh') return 'zh-CN' as Locale;
    if (base === 'ja') return 'ja' as Locale;
    if (base === 'en') return 'en' as Locale;
    if (base === 'ko') return 'ko' as Locale;
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

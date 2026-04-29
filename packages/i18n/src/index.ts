import ko from '../messages/ko.json';
import zhCN from '../messages/zh-CN.json';
import ja from '../messages/ja.json';
import en from '../messages/en.json';
import type { Locale } from '@hyliren/shared';

const messages: Record<Locale, typeof ko> = {
  'ko': ko,
  'zh-CN': zhCN,
  'ja': ja,
  'en': en,
};

/**
 * Get a translation value by dot-notation key.
 * Supports {param} interpolation.
 *
 * Fallback chain: requested locale → ko (default source) → key 자체.
 *
 * Usage: t('ja', 'proposal.list.title', { count: 3 }) → "3件の病院からの提案"
 */
export function t(locale: Locale, key: string, params?: Record<string, string | number>): string {
  const msg = messages[locale] || messages['ko'];
  const parts = key.split('.');
  let value = lookup(msg, parts);

  // 요청 locale 에서 키 누락 → ko fallback
  if (value === undefined && locale !== 'ko') {
    value = lookup(messages['ko'], parts);
  }

  if (typeof value !== 'string') {
    return key;
  }

  if (params) {
    return value.replace(/\{(\w+)\}/g, (_, k) => String(params[k] ?? `{${k}}`));
  }

  return value;
}

function lookup(obj: unknown, parts: string[]): unknown {
  let v: unknown = obj;
  for (const p of parts) {
    if (v && typeof v === 'object' && p in v) {
      v = (v as Record<string, unknown>)[p];
    } else {
      return undefined;
    }
  }
  return v;
}

export { messages };
export type { Locale };

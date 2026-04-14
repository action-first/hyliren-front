import ko from '../messages/ko.json';
import zhCN from '../messages/zh-CN.json';
import type { Locale } from '@hyliren/shared';

const messages: Record<string, typeof ko> = {
  'ko': ko,
  'zh-CN': zhCN,
};

/**
 * Get a translation value by dot-notation key.
 * Supports {param} interpolation.
 *
 * Usage: t('ko', 'proposal.list.title', { count: 3 }) → "3개 병원이 제안서를 보냈습니다"
 */
export function t(locale: Locale, key: string, params?: Record<string, string | number>): string {
  const msg = messages[locale] || messages['ko'];
  const parts = key.split('.');
  let value: unknown = msg;

  for (const part of parts) {
    if (value && typeof value === 'object' && part in value) {
      value = (value as Record<string, unknown>)[part];
    } else {
      return key; // fallback: return key itself
    }
  }

  if (typeof value !== 'string') return key;

  if (params) {
    return value.replace(/\{(\w+)\}/g, (_, k) => String(params[k] ?? `{${k}}`));
  }

  return value;
}

export { messages };
export type { Locale };

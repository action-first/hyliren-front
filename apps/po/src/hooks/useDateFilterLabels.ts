'use client';

import { ko, zhCN, ja, enUS } from 'date-fns/locale';
import type { Locale as DateFnsLocale } from 'date-fns';
import type { DateFilterLabels } from '@hyliren/ui';
import { useLocaleStore } from '@/store/locale';
import type { Locale as AppLocale } from '@hyliren/shared';

const DATE_LOCALES: Record<AppLocale, DateFnsLocale> = {
  'ko': ko,
  'zh-CN': zhCN,
  'ja': ja,
  'en': enUS,
};

const INTL_LOCALE_MAP: Record<AppLocale, string> = {
  'ko': 'ko-KR',
  'zh-CN': 'zh-CN',
  'ja': 'ja-JP',
  'en': 'en-US',
};

/**
 * DateFilter 의 i18n 라벨을 현재 locale 기준으로 생성.
 */
export function useDateFilterLabels(): DateFilterLabels {
  const locale = useLocaleStore(s => s.locale);
  const t = useLocaleStore(s => s.t);
  return {
    today: t('dateFilter.today'),
    last7Days: t('dateFilter.last7Days'),
    last30Days: t('dateFilter.last30Days'),
    customRange: t('dateFilter.customRange'),
    startDate: t('dateFilter.startDate'),
    startDatePlaceholder: t('dateFilter.startDatePlaceholder'),
    endDate: t('dateFilter.endDate'),
    endDatePlaceholder: t('dateFilter.endDatePlaceholder'),
    cancel: t('dateFilter.cancel'),
    apply: t('dateFilter.apply'),
    intlLocale: INTL_LOCALE_MAP[locale] ?? 'ko-KR',
    dateLocale: DATE_LOCALES[locale] ?? ko,
  };
}

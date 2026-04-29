'use client';

import { ko, zhCN, ja, enUS } from 'date-fns/locale';
import type { Locale as DateFnsLocale } from 'date-fns';
import type { DataGridLabels } from '@hyliren/ui';
import { useLocaleStore } from '@/store/locale';
import type { Locale as AppLocale } from '@hyliren/shared';

const DATE_LOCALES: Record<AppLocale, DateFnsLocale> = {
  'ko': ko,
  'zh-CN': zhCN,
  'ja': ja,
  'en': enUS,
};

/**
 * DataGrid 의 i18n 라벨을 현재 locale 기준으로 생성.
 * call site 마다 동일 라벨 객체를 작성하지 않도록 단일 진입점.
 */
export function useDataGridLabels(): DataGridLabels {
  const locale = useLocaleStore(s => s.locale);
  const t = useLocaleStore(s => s.t);
  return {
    dateFromPlaceholder: t('dataGrid.dateFromPlaceholder'),
    dateToPlaceholder: t('dataGrid.dateToPlaceholder'),
    selectAll: t('dataGrid.selectAll'),
    searchPlaceholder: t('dataGrid.searchPlaceholder'),
    searchButton: t('dataGrid.searchButton'),
    resetButton: t('dataGrid.resetButton'),
    defaultTitle: t('dataGrid.defaultTitle'),
    resultCountTemplate: t('dataGrid.resultCountTemplate'),
    exportButton: t('dataGrid.exportButton'),
    noRowsMessage: t('dataGrid.noRowsMessage'),
    exportModalTitle: t('dataGrid.exportModalTitle'),
    exportModalDesc: t('dataGrid.exportModalDesc'),
    exportAllTitle: t('dataGrid.exportAllTitle'),
    exportAllDescTemplate: t('dataGrid.exportAllDescTemplate'),
    exportFilteredTitle: t('dataGrid.exportFilteredTitle'),
    exportFilteredDesc: t('dataGrid.exportFilteredDesc'),
    exportSelectedTitle: t('dataGrid.exportSelectedTitle'),
    exportSelectedDesc: t('dataGrid.exportSelectedDesc'),
    cancel: t('dataGrid.cancel'),
    downloadButton: t('dataGrid.downloadButton'),
    dateLocale: DATE_LOCALES[locale] ?? ko,
  };
}

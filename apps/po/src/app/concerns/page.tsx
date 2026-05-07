'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  BODY_AREAS, BODY_AREA_BADGE,
  formatDateKR, formatDateRange, formatBudget,
} from '@hyliren/shared';
import type { BadgeColor } from '@hyliren/shared';
import {
  AdminPage, Card, Spinner, Button, DataGrid,
  badgeCellRenderer, countBadgeCellRenderer,
} from '@hyliren/ui';
import type { SearchField } from '@hyliren/ui';
import { AlertTriangle } from 'lucide-react';
import { POSidebar } from '@/components/POSidebar';
import { useToastStore } from '@/store/toast';
import { useLocaleStore } from '@/store/locale';
import { useDataGridLabels } from '@/hooks/useDataGridLabels';
import { toUserMessage } from '@/lib/api/error-messages';
import { useConcerns } from '@/hooks/queries/concerns';
import type { ConcernListQuery } from '@/lib/api/concern';
import type { ColDef } from 'ag-grid-community';

// 디폴트 검색 — 최근 한달 (DataGrid 의 디폴트와 동일하게 mount 시 backend 호출도 한달 기준)
function defaultMonthRange(): { from: string; to: string } {
  const today = new Date();
  const monthAgo = new Date();
  monthAgo.setMonth(today.getMonth() - 1);
  const fmt = (d: Date) => d.toISOString().slice(0, 10);
  return { from: fmt(monthAgo), to: fmt(today) };
}

// ── 타입 ──
interface ConcernRow {
  id: string;
  userName: string;
  primaryArea: string;
  bodyAreaDetail: string;
  description: string;
  budget: string;
  visitDate: string;
  /** FE-derived enum: 'not_sent' | 'sent' — 표시 라벨은 cellRenderer 에서 t() 매핑 */
  mySentStatus: 'not_sent' | 'sent';
  /** FE-derived 다국어 표시 라벨 (filter/render 용, 활성 locale 따름) */
  mySentLabel: string;
  createdAt: string;
  proposalCount: number;
  /** 본인 제안서 발송일 (없으면 '-') */
  mySentAt: string;
}

// "내 제안" 라벨 ↔ FE-derived state 매핑 (enum key 기반, locale 무관)
const MY_SENT_BADGE: Record<string, BadgeColor> = {
  not_sent: { bg: '#fef9c3', text: '#854d0e' },
  sent:     { bg: '#dbeafe', text: '#1e40af' },
};

function isSameQuery(a: ConcernListQuery, b: ConcernListQuery): boolean {
  return (
    (a.createdAtFrom ?? '') === (b.createdAtFrom ?? '') &&
    (a.createdAtTo ?? '') === (b.createdAtTo ?? '') &&
    (a.primaryArea ?? '') === (b.primaryArea ?? '') &&
    (a.keyword ?? '') === (b.keyword ?? '')
  );
}

// ── 페이지 ──
export default function ConcernListPage() {
  const router = useRouter();
  const showToast = useToastStore(s => s.showToast);
  const t = useLocaleStore(s => s.t);
  const locale = useLocaleStore(s => s.locale);
  const dataGridLabels = useDataGridLabels();

  // 검색 필드 (locale 별 t() 적용)
  const searchFields: SearchField[] = [
    { key: 'createdAt', label: t('po.concernFilterPeriod'), type: 'dateRange', row: 1 },
    { key: 'primaryArea', label: t('po.concernFilterArea'), type: 'select', row: 1, options: (BODY_AREAS as readonly string[]).map(a => ({ value: a, label: t(`common.bodyArea.${a}`) })) },
    { key: 'mySentStatus', label: t('po.concernFilterMyProposal'), type: 'select', row: 1, options: [
      { value: 'not_sent', label: t('po.concernMySentNot') },
      { value: 'sent', label: t('po.concernMySentDone') },
    ]},
    { key: '_keyword', label: t('po.concernFilterKeyword'), placeholder: t('po.concernFilterKeywordPh'), row: 2 },
  ];

  // 컬럼 정의 (locale 별 t() 적용)
  const columnDefs: ColDef<ConcernRow>[] = [
    {
      field: 'userName', headerName: t('po.concernColRegister'), flex: 0.6, minWidth: 80, filter: true,
      cellStyle: { color: 'var(--text-default)', fontWeight: 500 },
    },
    {
      field: 'primaryArea', headerName: t('po.concernColArea'), flex: 0.5, minWidth: 70, filter: true,
      cellRenderer: badgeCellRenderer(BODY_AREA_BADGE),
    },
    { field: 'bodyAreaDetail', headerName: t('po.concernColDetail'), flex: 0.7, minWidth: 80, filter: true },
    {
      field: 'description', headerName: t('po.concernColContent'), flex: 2, minWidth: 150, filter: true,
      cellStyle: { color: 'var(--text-subdued)' },
    },
    { field: 'budget', headerName: t('po.concernColBudget'), flex: 0.7, minWidth: 80, filter: false },
    { field: 'visitDate', headerName: t('po.concernColVisitDate'), flex: 0.8, minWidth: 90, filter: false },
    {
      field: 'mySentStatus', headerName: t('po.concernColMyProposal'), flex: 0.7, minWidth: 80, filter: true,
      // 셀 값은 enum (sent/not_sent), 표시 라벨은 활성 locale 의 t() 매핑
      cellRenderer: (p: { value: string }) => {
        const status = p.value;
        const c = MY_SENT_BADGE[status] || { bg: '#f3f4f6', text: '#374151' };
        const label = status === 'sent' ? t('po.concernMySentDone') : t('po.concernMySentNot');
        return (
          <span style={{
            display: 'inline-flex', alignItems: 'center',
            height: 22, padding: '0 8px', borderRadius: 4,
            fontSize: 12, fontWeight: 500, lineHeight: 1,
            background: c.bg, color: c.text,
          }}>{label}</span>
        );
      },
    },
    {
      field: 'createdAt', headerName: t('po.concernColCreatedAt'), flex: 0.7, minWidth: 80, filter: false,
      cellStyle: { color: 'var(--text-disabled)', fontVariantNumeric: 'tabular-nums' },
    },
    {
      field: 'proposalCount', headerName: t('po.concernColProposal'), flex: 0.5, minWidth: 60, filter: false,
      cellRenderer: countBadgeCellRenderer(t('po.concernCountUnit'), t('po.concernCountSent'), t('po.concernCountUnsent')),
    },
    {
      field: 'mySentAt', headerName: t('po.concernColSentDate'), flex: 0.7, minWidth: 80, filter: false,
      cellStyle: { color: 'var(--text-disabled)', fontVariantNumeric: 'tabular-nums' },
    },
  ];

  // query state — useConcerns 가 query 변경 시 자동 refetch.
  const [query, setQuery] = useState<ConcernListQuery>(() => {
    const { from, to } = defaultMonthRange();
    return { createdAtFrom: from, createdAtTo: to };
  });

  // React Query — 캐시 5분, keepPreviousData 로 검색 중 이전 데이터 유지.
  const { data, isLoading, isError, error, refetch } = useConcerns(query);

  // 에러 토스트 — RQ v5 가 onError 콜백 제거됨, useEffect 로 효과 처리.
  useEffect(() => {
    if (isError && error) {
      showToast(toUserMessage(error, t('po.concernsListLoadError'), t), 'error');
    }
  }, [isError, error, showToast]);

  // 초기 1회 load 후 = data 가 한 번이라도 채워진 시점. RQ 가 추적.
  const hasInitialLoad = data !== undefined;

  // mySentLabel 은 FE-only — BE 로 보내지 않고 rowData filter 단계에서 적용.
  const [mySentFilter, setMySentFilter] = useState<string>('');

  function handleSearch(filters: Record<string, string>) {
    const newQuery: ConcernListQuery = {};
    if (filters['createdAt_from']) newQuery.createdAtFrom = filters['createdAt_from'];
    if (filters['createdAt_to']) newQuery.createdAtTo = filters['createdAt_to'];
    if (filters['primaryArea']) newQuery.primaryArea = filters['primaryArea'];
    if (filters['_keyword']) newQuery.keyword = filters['_keyword'];
    setMySentFilter(filters['mySentStatus'] ?? '');
    // 같은 BE 조건을 다시 누르는 경우 React Query 는 staleTime 동안 cache hit 한다.
    // FO 에서 새 고민 작성 직후 PO 에서 검색 버튼을 눌렀을 때 최신 목록을 보장한다.
    if (isSameQuery(query, newQuery)) {
      void refetch();
      return;
    }
    setQuery(newQuery);
  }

  const rowData: ConcernRow[] = (data?.concerns ?? [])
    .map(c => ({
      id: c.id,
      userName: c.userName || t('common.anonymous'),
      primaryArea: c.primaryArea,
      bodyAreaDetail: c.bodyAreaDetail || '',
      description: c.description.length > 50 ? c.description.slice(0, 50) + '...' : c.description,
      budget: (c.budgetMin == null && c.budgetMax == null) ? '-' : `${formatBudget(c.budgetMin, c.budgetMax)}${t('common.man')}`,
      visitDate: c.visitDateFrom ? formatDateRange(c.visitDateFrom, c.visitDateTo) : t('common.tbd'),
      mySentStatus: c.mySentAt ? 'sent' : 'not_sent' as 'sent' | 'not_sent',
      mySentLabel: c.mySentAt ? t('po.concernMySentDone') : t('po.concernMySentNot'),
      createdAt: formatDateKR(c.createdAt, locale),
      proposalCount: c.proposalCount,
      mySentAt: c.mySentAt ? formatDateKR(c.mySentAt, locale) : '-',
    }))
    .filter(r => !mySentFilter || r.mySentStatus === mySentFilter);

  return (
    <AdminPage sidebar={<POSidebar active="/concerns" />} title={t('po.concernsListTitle')} prefix="po">
      {/* 초기 1회 load 전: spinner / error 카드 */}
      {!hasInitialLoad && isLoading && (
        <Card padding="md">
          <div className="flex items-center justify-center py-12"><Spinner /></div>
        </Card>
      )}

      {!hasInitialLoad && isError && (
        <Card padding="md">
          <div className="text-center py-10">
            <AlertTriangle size={28} className="mx-auto mb-2 text-[var(--color-danger)]" />
            <p className="text-[var(--text-sm)] font-medium text-[var(--text-default)] mb-1">
              {t('po.concernsListLoadError')}
            </p>
            <p className="text-[var(--text-xs)] text-[var(--text-disabled)] mb-4">
              {toUserMessage(error, t('po.unknownError'), t)}
            </p>
            <Button variant="secondary" size="sm" onClick={() => refetch()}>
              {t('common.retry')}
            </Button>
          </div>
        </Card>
      )}

      {/* 초기 load 후: DataGrid mount 유지 → search form state 보존.
          재검색 실패는 toast 로만 알림 (이전 데이터는 keepPreviousData 로 유지). */}
      {hasInitialLoad && (
        <DataGrid<ConcernRow>
          columnDefs={columnDefs}
          rowData={rowData}
          searchFields={searchFields}
          exportFileName={t('po.concernsExportFileName')}
          title={t('po.concernsListGridTitle')}
          labels={dataGridLabels}
          onRowClick={(data) => router.push(`/concerns/${data.id}`)}
          onSearch={handleSearch}
        />
      )}
    </AdminPage>
  );
}

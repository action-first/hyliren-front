'use client';

import { useCallback, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  BODY_AREAS, CONCERN_STATUS_KR, CONCERN_STATUS_BADGE, BODY_AREA_DOT,
  formatDateKR, formatDateRange, formatBudget,
} from '@hyliren/shared';
import {
  AdminPage, DataGrid,
  badgeCellRenderer, dotTextRenderer, countBadgeCellRenderer, actionCellRenderer,
} from '@hyliren/ui';
import type { SearchField } from '@hyliren/ui';
import { POSidebar } from '@/components/POSidebar';
import { listConcerns, type ConcernListQuery, type ConcernSummaryWire } from '@/lib/api/concern';
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
  primaryArea: string;
  bodyAreaDetail: string;
  description: string;
  budget: string;
  visitDate: string;
  status: string;
  statusLabel: string;
  createdAt: string;
  proposalCount: number;
}

// ── 검색 필드 (2줄) ──
const searchFields: SearchField[] = [
  // 1줄: 기간, 부위, 상태
  { key: 'createdAt', label: '기간', type: 'dateRange', row: 1 },
  { key: 'primaryArea', label: '부위', type: 'select', row: 1, options: (BODY_AREAS as readonly string[]).map(a => ({ value: a, label: a })) },
  { key: 'statusLabel', label: '상태', type: 'select', row: 1, options: [
    { value: '접수됨', label: '접수됨' },
    { value: '제안 대기', label: '제안 대기' },
    { value: '제안 도착', label: '제안 도착' },
    { value: '비교 중', label: '비교 중' },
  ]},
  // 2줄: 키워드
  { key: '_keyword', label: '키워드', placeholder: '고민 내용, 부위, 상세 통합 검색', row: 2 },
];

// ── 컬럼 정의 ──
const columnDefs: ColDef<ConcernRow>[] = [
  {
    field: 'primaryArea', headerName: '부위', flex: 0.5, minWidth: 70, filter: true,
    cellRenderer: dotTextRenderer(BODY_AREA_DOT),
  },
  { field: 'bodyAreaDetail', headerName: '상세', flex: 0.7, minWidth: 80, filter: true },
  {
    field: 'description', headerName: '고민 내용', flex: 2, minWidth: 150, filter: true,
    cellStyle: { color: '#6b7280' },
  },
  { field: 'budget', headerName: '예산', flex: 0.7, minWidth: 80, filter: false },
  { field: 'visitDate', headerName: '방문 시기', flex: 0.8, minWidth: 90, filter: false },
  {
    field: 'statusLabel', headerName: '상태', flex: 0.7, minWidth: 80, filter: true,
    cellRenderer: badgeCellRenderer(CONCERN_STATUS_BADGE),
  },
  {
    field: 'proposalCount', headerName: '제안', flex: 0.5, minWidth: 60, filter: false,
    cellRenderer: countBadgeCellRenderer('건', '발송', '미발송'),
  },
  {
    field: 'createdAt', headerName: '등록일', flex: 0.7, minWidth: 80, filter: false,
    cellStyle: { color: '#9ca3af', fontVariantNumeric: 'tabular-nums' },
  },
  {
    headerName: '액션', flex: 0.6, minWidth: 80, sortable: false, resizable: false, filter: false,
    cellRenderer: actionCellRenderer<ConcernRow>([
      { label: '제안', href: d => `/concerns/${d.id}/propose`, primary: true },
      { label: '상세', href: d => `/concerns/${d.id}` },
    ]),
  },
];

// ── 페이지 ──
export default function ConcernListPage() {
  const router = useRouter();
  const [allConcerns, setAllConcerns] = useState<ConcernSummaryWire[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // backend 호출 — 디폴트/검색 모두 같은 함수 경로
  const fetchConcerns = useCallback((query: ConcernListQuery) => {
    setLoading(true);
    setError(false);
    listConcerns(query)
      .then((data) => {
        setAllConcerns(data.concerns);
        setLoading(false);
      })
      .catch(() => { setError(true); setLoading(false); });
  }, []);

  useEffect(() => {
    const { from, to } = defaultMonthRange();
    fetchConcerns({ createdAtFrom: from, createdAtTo: to });
  }, [fetchConcerns]);

  // DataGrid 검색 → backend 재호출. status 는 backend 가 SUBMITTED 고정이라 client 후처리.
  function handleSearch(filters: Record<string, string>) {
    const query: ConcernListQuery = {};
    if (filters['createdAt_from']) query.createdAtFrom = filters['createdAt_from'];
    if (filters['createdAt_to']) query.createdAtTo = filters['createdAt_to'];
    if (filters['primaryArea']) query.primaryArea = filters['primaryArea'];
    if (filters['_keyword']) query.keyword = filters['_keyword'];
    fetchConcerns(query);
    setStatusFilter(filters['statusLabel'] || '');
  }

  const rowData: ConcernRow[] = allConcerns
    .map(c => ({
      id: c.id,
      primaryArea: c.primaryArea,
      bodyAreaDetail: c.bodyAreaDetail || '',
      description: c.description.length > 50 ? c.description.slice(0, 50) + '...' : c.description,
      budget: formatBudget(c.budgetMin, c.budgetMax),
      visitDate: formatDateRange(c.visitDateFrom, c.visitDateTo),
      status: c.status,
      statusLabel: CONCERN_STATUS_KR[c.status] || c.status,
      createdAt: formatDateKR(c.createdAt),
      proposalCount: c.proposalCount,
    }))
    // status 필터 (선택 시) — backend 미지원 영역
    .filter(r => !statusFilter || r.statusLabel === statusFilter);

  if (loading) return null;

  if (error) {
    return (
      <AdminPage sidebar={<POSidebar active="/concerns" />} title="고민 리스트" prefix="po">
        <div className="text-center py-20 text-[#9ca3af]">데이터를 불러오지 못했습니다. 새로고침해 주세요.</div>
      </AdminPage>
    );
  }

  return (
    <AdminPage sidebar={<POSidebar active="/concerns" />} title="고민 리스트" prefix="po">
      <DataGrid<ConcernRow>
        columnDefs={columnDefs}
        rowData={rowData}
        searchFields={searchFields}
        exportFileName="고민목록"
        title="고민 목록"
        onRowClick={(data) => router.push(`/concerns/${data.id}`)}
        onSearch={handleSearch}
      />
    </AdminPage>
  );
}

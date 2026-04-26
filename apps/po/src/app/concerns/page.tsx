'use client';

import { useCallback, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  BODY_AREAS, CONCERN_STATUS_KR, CONCERN_STATUS_BADGE, BODY_AREA_BADGE,
  formatDateKR, formatDateRange, formatBudget,
} from '@hyliren/shared';
import {
  AdminPage, Card, Spinner, Button, DataGrid,
  badgeCellRenderer, countBadgeCellRenderer,
} from '@hyliren/ui';
import type { SearchField } from '@hyliren/ui';
import { AlertTriangle } from 'lucide-react';
import { POSidebar } from '@/components/POSidebar';
import { useToastStore } from '@/store/toast';
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
  userName: string;
  primaryArea: string;
  bodyAreaDetail: string;
  description: string;
  budget: string;
  visitDate: string;
  status: string;
  statusLabel: string;
  createdAt: string;
  proposalCount: number;
  /** 본인 제안서 발송일 (없으면 '-') */
  mySentAt: string;
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

// ── 컬럼 정의: 등록자 / 부위 / 상세 / 고민내용 / 예산 / 방문시기 / 상태 / 등록일 / 제안 / 발송일 ──
const columnDefs: ColDef<ConcernRow>[] = [
  {
    field: 'userName', headerName: '등록자', flex: 0.6, minWidth: 80, filter: true,
    cellStyle: { color: 'var(--text-default)', fontWeight: 500 },
  },
  {
    field: 'primaryArea', headerName: '부위', flex: 0.5, minWidth: 70, filter: true,
    cellRenderer: badgeCellRenderer(BODY_AREA_BADGE),
  },
  { field: 'bodyAreaDetail', headerName: '상세', flex: 0.7, minWidth: 80, filter: true },
  {
    field: 'description', headerName: '고민내용', flex: 2, minWidth: 150, filter: true,
    cellStyle: { color: 'var(--text-subdued)' },
  },
  { field: 'budget', headerName: '예산', flex: 0.7, minWidth: 80, filter: false },
  { field: 'visitDate', headerName: '방문시기', flex: 0.8, minWidth: 90, filter: false },
  {
    field: 'statusLabel', headerName: '상태', flex: 0.7, minWidth: 80, filter: true,
    cellRenderer: badgeCellRenderer(CONCERN_STATUS_BADGE),
  },
  {
    field: 'createdAt', headerName: '등록일', flex: 0.7, minWidth: 80, filter: false,
    cellStyle: { color: 'var(--text-disabled)', fontVariantNumeric: 'tabular-nums' },
  },
  {
    field: 'proposalCount', headerName: '제안', flex: 0.5, minWidth: 60, filter: false,
    cellRenderer: countBadgeCellRenderer('건', '발송', '미발송'),
  },
  {
    field: 'mySentAt', headerName: '발송일', flex: 0.7, minWidth: 80, filter: false,
    cellStyle: { color: 'var(--text-disabled)', fontVariantNumeric: 'tabular-nums' },
  },
];

// ── 페이지 ──
export default function ConcernListPage() {
  const router = useRouter();
  const showToast = useToastStore(s => s.showToast);
  const [allConcerns, setAllConcerns] = useState<ConcernSummaryWire[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [loading, setLoading] = useState(true);
  // 마지막 query 보존 — 재시도 / 에러 후 회복 시 사용 (treatments 패턴 일관)
  const [lastQuery, setLastQuery] = useState<ConcernListQuery>({});
  const [loadError, setLoadError] = useState<string | null>(null);

  // backend 호출 — 디폴트/검색 모두 같은 함수 경로
  const fetchConcerns = useCallback((query: ConcernListQuery) => {
    setLoading(true);
    setLoadError(null);
    setLastQuery(query);
    listConcerns(query)
      .then((data) => {
        setAllConcerns(data.concerns);
      })
      .catch((e: unknown) => {
        const msg = e instanceof Error ? e.message : '목록을 불러올 수 없습니다';
        setLoadError(msg);
        showToast(msg, 'error');
      })
      .finally(() => setLoading(false));
  }, [showToast]);

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
      userName: c.userName,
      primaryArea: c.primaryArea,
      bodyAreaDetail: c.bodyAreaDetail || '',
      description: c.description.length > 50 ? c.description.slice(0, 50) + '...' : c.description,
      budget: formatBudget(c.budgetMin, c.budgetMax),
      visitDate: formatDateRange(c.visitDateFrom, c.visitDateTo),
      status: c.status,
      statusLabel: CONCERN_STATUS_KR[c.status] || c.status,
      createdAt: formatDateKR(c.createdAt),
      proposalCount: c.proposalCount,
      mySentAt: c.mySentAt ? formatDateKR(c.mySentAt) : '-',
    }))
    // status 필터 (선택 시) — backend 미지원 영역
    .filter(r => !statusFilter || r.statusLabel === statusFilter);

  return (
    <AdminPage sidebar={<POSidebar active="/concerns" />} title="고민 리스트" prefix="po">
      {loading && (
        <Card padding="md">
          <div className="flex items-center justify-center py-12"><Spinner /></div>
        </Card>
      )}

      {!loading && loadError && (
        <Card padding="md">
          <div className="text-center py-10">
            <AlertTriangle size={28} className="mx-auto mb-2 text-[var(--color-danger)]" />
            <p className="text-[var(--text-sm)] font-medium text-[var(--text-default)] mb-1">
              목록을 불러오지 못했어요
            </p>
            <p className="text-[var(--text-xs)] text-[var(--text-disabled)] mb-4">{loadError}</p>
            <Button variant="secondary" size="sm" onClick={() => fetchConcerns(lastQuery)}>
              다시 시도
            </Button>
          </div>
        </Card>
      )}

      {!loading && !loadError && (
        <DataGrid<ConcernRow>
          columnDefs={columnDefs}
          rowData={rowData}
          searchFields={searchFields}
          exportFileName="고민목록"
          title="고민 목록"
          onRowClick={(data) => router.push(`/concerns/${data.id}`)}
          onSearch={handleSearch}
        />
      )}
    </AdminPage>
  );
}

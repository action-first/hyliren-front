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
  /** FE-derived: '미발송' | '발송완료' */
  mySentLabel: string;
  createdAt: string;
  proposalCount: number;
  /** 본인 제안서 발송일 (없으면 '-') */
  mySentAt: string;
}

// ── 검색 필드 (2줄) ──
// 상태 필터: BE ConcernStatus(draft|submitted|closed) 는 매칭 시장 partner 한텐 의미 없음
// (default 가 SUBMITTED 만). 대신 partner 가 실제로 궁금한 건 "내가 제안 보냈는가" — FE-derived.
const searchFields: SearchField[] = [
  // 1줄: 기간, 부위, 내 제안 여부
  { key: 'createdAt', label: '기간', type: 'dateRange', row: 1 },
  { key: 'primaryArea', label: '부위', type: 'select', row: 1, options: (BODY_AREAS as readonly string[]).map(a => ({ value: a, label: a })) },
  { key: 'mySentLabel', label: '내 제안', type: 'select', row: 1, options: [
    { value: '미발송', label: '미발송' },
    { value: '발송완료', label: '발송완료' },
  ]},
  // 2줄: 키워드
  { key: '_keyword', label: '키워드', placeholder: '고민 내용, 부위, 상세 통합 검색', row: 2 },
];

// "내 제안" 라벨 ↔ FE-derived state 매핑.
const MY_SENT_BADGE: Record<string, BadgeColor> = {
  '미발송':   { bg: '#fef9c3', text: '#854d0e' },
  '발송완료': { bg: '#dbeafe', text: '#1e40af' },
};

// ── 컬럼 정의: 등록자 / 부위 / 상세 / 고민내용 / 예산 / 방문시기 / 내 제안 / 등록일 / 제안 / 발송일 ──
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
    field: 'mySentLabel', headerName: '내 제안', flex: 0.7, minWidth: 80, filter: true,
    cellRenderer: badgeCellRenderer(MY_SENT_BADGE),
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
      showToast(toUserMessage(error, '목록을 불러올 수 없습니다'), 'error');
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
    setMySentFilter(filters['mySentLabel'] ?? '');
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
      userName: c.userName,
      primaryArea: c.primaryArea,
      bodyAreaDetail: c.bodyAreaDetail || '',
      description: c.description.length > 50 ? c.description.slice(0, 50) + '...' : c.description,
      budget: formatBudget(c.budgetMin, c.budgetMax),
      visitDate: formatDateRange(c.visitDateFrom, c.visitDateTo),
      mySentLabel: c.mySentAt ? '발송완료' : '미발송',
      createdAt: formatDateKR(c.createdAt),
      proposalCount: c.proposalCount,
      mySentAt: c.mySentAt ? formatDateKR(c.mySentAt) : '-',
    }))
    .filter(r => !mySentFilter || r.mySentLabel === mySentFilter);

  return (
    <AdminPage sidebar={<POSidebar active="/concerns" />} title="고민 리스트" prefix="po">
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
              목록을 불러오지 못했어요
            </p>
            <p className="text-[var(--text-xs)] text-[var(--text-disabled)] mb-4">
              {toUserMessage(error, '알 수 없는 오류')}
            </p>
            <Button variant="secondary" size="sm" onClick={() => refetch()}>
              다시 시도
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
          exportFileName="고민목록"
          title="고민 목록"
          onRowClick={(data) => router.push(`/concerns/${data.id}`)}
          onSearch={handleSearch}
        />
      )}
    </AdminPage>
  );
}

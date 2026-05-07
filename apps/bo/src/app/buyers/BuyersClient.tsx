'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CONCERN_STATUS_KR, CONCERN_STATUS_BADGE, formatDateKR } from '@hyliren/shared';
import { DataGrid, AdminPage, detailLinkRenderer, Spinner } from '@hyliren/ui';
import type { SearchField } from '@hyliren/ui';
import type { ColDef } from 'ag-grid-community';
import { BOSidebar } from '@/components/BOSidebar';
import { listBuyers, type AdminBuyerListItem } from '@/lib/api/admin-buyers';

interface BuyerRow {
  id: string;
  name: string;
  contact: string;
  locale: string;
  concernCount: number;
  /** concern.status enum — cellRenderer 가 KR 라벨 매핑. */
  latestStatusEnum: string;
  createdAt: string;
}

const searchFields: SearchField[] = [
  { key: 'createdAt', label: '기간', type: 'dateRange', row: 1 },
  { key: 'locale', label: '언어', type: 'select', row: 1, options: [
    { value: 'ko', label: '한국어' }, { value: 'zh-CN', label: '中文' },
  ]},
  { key: '_keyword', label: '키워드', placeholder: '이름, 연락처 통합 검색', row: 2 },
];

const columnDefs: ColDef<BuyerRow>[] = [
  { field: 'name', headerName: '이름', flex: 1, minWidth: 100, filter: true,
    cellStyle: { fontWeight: 500 },
  },
  { field: 'contact', headerName: '연락처', flex: 1.5, minWidth: 150, filter: true },
  { field: 'locale', headerName: '언어', flex: 0.5, minWidth: 60, filter: true },
  { field: 'concernCount', headerName: '고민 수', flex: 0.5, minWidth: 70, filter: false,
    cellStyle: { fontVariantNumeric: 'tabular-nums' },
  },
  { field: 'latestStatusEnum', headerName: '최신 상태', flex: 0.7, minWidth: 90, filter: true,
    cellRenderer: (p: { value: string }) => {
      if (!p.value) return null;
      const c = CONCERN_STATUS_BADGE[p.value] || { bg: '#f3f4f6', text: '#374151' };
      const label = CONCERN_STATUS_KR[p.value] || p.value;
      return (
        <span style={{
          display: 'inline-flex', alignItems: 'center', height: 22,
          padding: '0 8px', borderRadius: 4,
          fontSize: 12, fontWeight: 500, lineHeight: 1,
          background: c.bg, color: c.text,
        }}>{label}</span>
      );
    },
  },
  { field: 'createdAt', headerName: '가입일', flex: 0.7, minWidth: 90, filter: false,
    cellStyle: { color: '#9ca3af', fontVariantNumeric: 'tabular-nums' },
  },
  { headerName: '액션', flex: 0.5, minWidth: 60, sortable: false, resizable: false, filter: false,
    cellRenderer: detailLinkRenderer<BuyerRow>('/buyers', '상세', '#18181b'),
  },
];

function toRow(item: AdminBuyerListItem): BuyerRow {
  return {
    id: item.id,
    name: item.name,
    contact: item.phone || item.email || '',
    locale: item.locale,
    concernCount: item.concernCount,
    latestStatusEnum: item.latestConcernStatus ?? '',
    createdAt: formatDateKR(item.createdAt),
  };
}

export function BuyersClient() {
  const router = useRouter();
  const [rows, setRows] = useState<BuyerRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    listBuyers()
      .then((items) => {
        if (cancelled) return;
        setRows(items.map(toRow));
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : '고객 목록을 불러오지 못했습니다.');
      });
    return () => { cancelled = true; };
  }, []);

  return (
    <AdminPage sidebar={<BOSidebar active="/buyers" />} title="고객 관리" prefix="bo">
      {error ? (
        <div style={{ padding: 24, color: 'var(--color-danger,#d72c0d)', fontSize: 13 }}>{error}</div>
      ) : rows === null ? (
        <div style={{ minHeight: 240, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Spinner />
        </div>
      ) : (
        <DataGrid<BuyerRow>
          columnDefs={columnDefs}
          rowData={rows}
          searchFields={searchFields}
          exportFileName="고객목록"
          title="고객 목록"
          onRowClick={(data) => router.push(`/buyers/${data.id}`)}
        />
      )}
    </AdminPage>
  );
}

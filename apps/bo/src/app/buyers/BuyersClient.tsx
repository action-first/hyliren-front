'use client';

import { useRouter } from 'next/navigation';
import {
  MOCK_USERS, CONCERN_STATUS_KR, CONCERN_STATUS_BADGE, formatDateKR,
} from '@hyliren/shared';
import type { Concern } from '@hyliren/shared';
import {
  DataGrid, AdminPage,
  badgeCellRenderer, detailLinkRenderer,
} from '@hyliren/ui';
import type { SearchField } from '@hyliren/ui';
import { BOSidebar } from '@/components/BOSidebar';
import type { ColDef } from 'ag-grid-community';

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

export function BuyersClient({ concerns }: { concerns: Concern[] }) {
  const router = useRouter();
  const buyers = MOCK_USERS.filter(u => u.role === 'buyer');

  const rowData: BuyerRow[] = buyers.map(u => {
    const userConcerns = concerns.filter(c => c.userId === u.id && !c.deletedAt);
    const latest = userConcerns.sort((a, b) =>
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    )[0];
    return {
      id: u.id,
      name: u.name,
      contact: u.phone || u.email || '',
      locale: u.locale,
      concernCount: userConcerns.length,
      latestStatusEnum: latest?.status ?? '',
      createdAt: formatDateKR(u.createdAt),
    };
  });

  return (
    <AdminPage sidebar={<BOSidebar active="/buyers" />} title="고객 관리" prefix="bo">
      <DataGrid<BuyerRow>
        columnDefs={columnDefs}
        rowData={rowData}
        searchFields={searchFields}
        exportFileName="고객목록"
        title="고객 목록"
        onRowClick={(data) => router.push(`/buyers/${data.id}`)}
      />
    </AdminPage>
  );
}

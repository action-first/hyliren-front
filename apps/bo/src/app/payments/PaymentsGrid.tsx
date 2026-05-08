'use client';

import { DataGrid, badgeCellRenderer, dotTextRenderer } from '@hyliren/ui';
import type { SearchField } from '@hyliren/ui';
import type { ColDef } from 'ag-grid-community';
import { formatKRW } from '@hyliren/shared';

interface PaymentRow {
  id: string;
  timestamp: string;
  type: string;
  actor: string;
  amount: number;
  status: string;
}

const TYPE_DOT: Record<string, string> = {
  '크레딧 충전': '#3b82f6', '리포트 구매': '#ec4899', '서비스 구매': '#8b5cf6',
};

const STATUS_BADGE: Record<string, { bg: string; text: string }> = {
  '결제 완료': { bg: '#dcfce7', text: '#166534' },
  '대기':     { bg: '#fef9c3', text: '#854d0e' },
  '환불':     { bg: '#fef2f2', text: '#991b1b' },
};

const searchFields: SearchField[] = [
  { key: 'timestamp', label: '기간', type: 'dateRange', row: 1 },
  { key: 'type', label: '유형', type: 'select', row: 1, options: [
    { value: '크레딧 충전', label: '크레딧 충전' },
    { value: '리포트 구매', label: '리포트 구매' },
    { value: '서비스 구매', label: '서비스 구매' },
  ]},
  { key: 'status', label: '상태', type: 'select', row: 1, options: [
    { value: '결제 완료', label: '결제 완료' },
    { value: '대기', label: '대기' },
    { value: '환불', label: '환불' },
  ]},
  { key: '_keyword', label: '키워드', placeholder: '주체명, 유형 통합 검색', row: 2 },
];

const columnDefs: ColDef<PaymentRow>[] = [
  { field: 'timestamp', headerName: '날짜', flex: 0.8, minWidth: 130, filter: false,
    cellStyle: { color: 'var(--text-disabled)', fontVariantNumeric: 'tabular-nums', fontSize: '12px' },
  },
  { field: 'type', headerName: '유형', flex: 0.6, minWidth: 100, filter: true,
    cellRenderer: dotTextRenderer(TYPE_DOT),
  },
  { field: 'actor', headerName: '주체', flex: 1, minWidth: 140, filter: true,
    cellStyle: { fontWeight: 500 },
  },
  { field: 'amount', headerName: '금액', flex: 0.8, minWidth: 130, filter: false,
    // 원 단위 결제 금액 — "1,500,000원" 약 110~130px 필요 (가격 단위 SSOT)
    valueFormatter: p => formatKRW(p.value as number),
    cellStyle: { fontWeight: 600, fontVariantNumeric: 'tabular-nums' },
  },
  { field: 'status', headerName: '상태', flex: 0.5, minWidth: 90, filter: true,
    cellRenderer: badgeCellRenderer(STATUS_BADGE),
  },
];

export function PaymentsGrid({ rows }: { rows: PaymentRow[] }) {
  return (
    <DataGrid<PaymentRow>
      columnDefs={columnDefs}
      rowData={rows}
      searchFields={searchFields}
      exportFileName="결제내역"
      title="결제 내역"
    />
  );
}

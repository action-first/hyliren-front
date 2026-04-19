'use client';

import { Card, Badge, SectionHeader, AdminPage, DataGrid, badgeCellRenderer } from '@hyliren/ui';
import type { SearchField } from '@hyliren/ui';
import { BOSidebar } from '@/components/BOSidebar';
import type { ColDef } from 'ag-grid-community';

const REVENUE_SUMMARY = [
  { label: '제안서 크레딧', amount: '1,245,000', count: 83 },
  { label: '검증 리포트', amount: '3,200,000', count: 24 },
  { label: '실행 서비스', amount: '5,800,000', count: 12 },
  { label: 'VIP 패키지', amount: '8,400,000', count: 4 },
];

interface OrderRow {
  id: string;
  type: string;
  buyer: string;
  concern: string;
  price: string;
  statusLabel: string;
  date: string;
}

const RECENT_ORDERS: OrderRow[] = [
  { id: 'o-001', type: '리포트', buyer: '리리', concern: '눈 · 매몰쌍꺼풀', price: '₩150,000', statusLabel: '결제 완료', date: '2026-04-12' },
  { id: 'o-002', type: '서비스', buyer: '메이', concern: '리프팅', price: '₩350,000', statusLabel: '처리 중', date: '2026-04-11' },
  { id: 'o-003', type: '리포트', buyer: '리리', concern: '눈 · 눈밑지방', price: '₩200,000', statusLabel: '전달 완료', date: '2026-04-08' },
];

const STATUS_BADGE: Record<string, { bg: string; text: string }> = {
  '결제 완료': { bg: '#dcfce7', text: '#166534' },
  '처리 중':   { bg: '#fef9c3', text: '#854d0e' },
  '전달 완료': { bg: '#dbeafe', text: '#1e40af' },
};

const orderSearchFields: SearchField[] = [
  { key: 'date', label: '기간', type: 'dateRange', row: 1 },
  { key: 'type', label: '유형', type: 'select', row: 1, options: [
    { value: '리포트', label: '리포트' }, { value: '서비스', label: '서비스' },
  ]},
  { key: '_keyword', label: '키워드', placeholder: '고객명, 고민 통합 검색', row: 2 },
];

const orderColumnDefs: ColDef<OrderRow>[] = [
  { field: 'type', headerName: '유형', flex: 0.5, minWidth: 70, filter: true },
  { field: 'buyer', headerName: '고객', flex: 0.6, minWidth: 80, filter: true, cellStyle: { fontWeight: 500 } },
  { field: 'concern', headerName: '고민', flex: 1, minWidth: 120, filter: true },
  { field: 'price', headerName: '금액', flex: 0.6, minWidth: 90, filter: false, cellStyle: { fontWeight: 600 } },
  { field: 'statusLabel', headerName: '상태', flex: 0.6, minWidth: 80, filter: true,
    cellRenderer: badgeCellRenderer(STATUS_BADGE),
  },
  { field: 'date', headerName: '날짜', flex: 0.6, minWidth: 90, filter: false,
    cellStyle: { color: '#9ca3af', fontVariantNumeric: 'tabular-nums' },
  },
];

export default function RevenuePage() {
  const total = REVENUE_SUMMARY.reduce((sum, r) => sum + parseInt(r.amount.replace(/,/g, '')), 0);

  return (
    <AdminPage sidebar={<BOSidebar active="/revenue" />} title="매출 현황" prefix="bo">
      {/* Total */}
      <Card padding="md" className="mb-5">
        <SectionHeader title="총 매출" />
        <div className="mt-3">
          <span style={{ fontSize: 28, fontWeight: 700, color: '#0f172a' }}>₩{total.toLocaleString()}</span>
        </div>
      </Card>

      {/* Revenue by type */}
      <div className="kpi-grid" style={{ marginBottom: 20 }}>
        {REVENUE_SUMMARY.map(r => (
          <Card key={r.label} padding="md">
            <span className="kpi-label">{r.label}</span>
            <span className="kpi-value" style={{ fontSize: 20 }}>₩{r.amount}</span>
            <span className="kpi-sub">{r.count}건</span>
          </Card>
        ))}
      </div>

      {/* Recent orders - DataGrid */}
      <DataGrid<OrderRow>
        columnDefs={orderColumnDefs}
        rowData={RECENT_ORDERS}
        searchFields={orderSearchFields}
        exportFileName="주문내역"
        title="최근 주문"
      />
    </AdminPage>
  );
}

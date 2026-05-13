'use client';

import { useEffect, useMemo, useState } from 'react';
import { Card, SectionHeader, AdminPage, Spinner } from '@hyliren/ui';
import { DataGrid } from '@hyliren/ui/datagrid';
import type { SearchField } from '@hyliren/ui/datagrid';
import { ORDER_STATUS_KR, formatKRW, formatDateKR } from '@hyliren/shared';
import { BOSidebar } from '@/components/BOSidebar';
import { listPayments, type AdminPaymentListItem, type PaymentType, type PaymentStatus } from '@/lib/api/admin-payments';
import type { ColDef } from 'ag-grid-community';

interface OrderRow {
  id: string;
  type: PaymentType;
  typeLabel: string;
  buyer: string;
  price: string;
  status: PaymentStatus;
  date: string;
}

const TYPE_KR: Record<PaymentType, string> = {
  report: '리포트',
  service: '서비스',
};

// payment.status enum 키 → 뱃지 색상 (BE: pending/paid/cancelled/refunded).
const PAYMENT_STATUS_BADGE: Record<string, { bg: string; text: string }> = {
  pending:   { bg: '#fef9c3', text: '#854d0e' },
  paid:      { bg: '#dcfce7', text: '#166534' },
  cancelled: { bg: '#fef2f2', text: '#991b1b' },
  refunded:  { bg: '#f3f4f6', text: '#6b7280' },
};

const orderSearchFields: SearchField[] = [
  { key: 'date', label: '기간', type: 'dateRange', row: 1 },
  { key: 'typeLabel', label: '유형', type: 'select', row: 1, options: [
    { value: '리포트', label: '리포트' }, { value: '서비스', label: '서비스' },
  ]},
  { key: '_keyword', label: '키워드', placeholder: '고객명 통합 검색', row: 2 },
];

const orderColumnDefs: ColDef<OrderRow>[] = [
  { field: 'typeLabel', headerName: '유형', flex: 0.5, minWidth: 70, filter: true },
  { field: 'buyer', headerName: '고객', flex: 0.8, minWidth: 100, filter: true, cellStyle: { fontWeight: 500 } },
  { field: 'price', headerName: '금액', flex: 0.7, minWidth: 100, filter: false, cellStyle: { fontWeight: 600 } },
  { field: 'status', headerName: '상태', flex: 0.6, minWidth: 90, filter: true,
    cellRenderer: (p: { value: string }) => {
      if (!p.value) return null;
      const c = PAYMENT_STATUS_BADGE[p.value] || { bg: '#f3f4f6', text: '#374151' };
      const label = ORDER_STATUS_KR[p.value] || p.value;
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
  { field: 'date', headerName: '날짜', flex: 0.7, minWidth: 100, filter: false,
    cellStyle: { color: 'var(--text-disabled)', fontVariantNumeric: 'tabular-nums' },
  },
];

function toRow(p: AdminPaymentListItem): OrderRow {
  return {
    id: p.id,
    type: p.type,
    typeLabel: TYPE_KR[p.type] ?? p.type,
    buyer: p.actorName ?? p.actorId,
    price: formatKRW(p.amount),
    status: p.status,
    date: formatDateKR(p.paidAt ?? p.createdAt),
  };
}

export default function RevenuePage() {
  const [payments, setPayments] = useState<AdminPaymentListItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    listPayments()
      .then((items) => { if (!cancelled) setPayments(items); })
      .catch((e: unknown) => {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : '매출 데이터를 불러오지 못했습니다.');
      });
    return () => { cancelled = true; };
  }, []);

  const summary = useMemo(() => {
    if (!payments) return null;
    const paid = payments.filter((p) => p.status === 'paid');
    const total = paid.reduce((s, p) => s + p.amount, 0);
    const byType = paid.reduce<Record<PaymentType, { amount: number; count: number }>>(
      (acc, p) => {
        acc[p.type] = acc[p.type] ?? { amount: 0, count: 0 };
        acc[p.type].amount += p.amount;
        acc[p.type].count += 1;
        return acc;
      },
      { report: { amount: 0, count: 0 }, service: { amount: 0, count: 0 } },
    );
    return { total, paidCount: paid.length, byType };
  }, [payments]);

  const rows = useMemo(() => (payments ?? []).map(toRow), [payments]);

  return (
    <AdminPage sidebar={<BOSidebar active="/revenue" />} title="매출 현황" prefix="bo">
      {error ? (
        <div style={{ padding: 24, color: 'var(--color-danger,#d72c0d)', fontSize: 13 }}>{error}</div>
      ) : !summary ? (
        <div style={{ minHeight: 240, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Spinner />
        </div>
      ) : (
        <>
          {/* Total */}
          <Card padding="md" className="mb-5">
            <SectionHeader title="총 매출" subtitle={`결제 완료 ${summary.paidCount}건 기준`} />
            <div className="mt-3">
              <span style={{ fontSize: 28, fontWeight: 700, color: 'var(--text-default)' }}>
                {formatKRW(summary.total)}
              </span>
            </div>
          </Card>

          {/* Revenue by type — BE 가 노출하는 2개 유형 */}
          <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)', marginBottom: 20 }}>
            <Card padding="md">
              <span className="kpi-label">{TYPE_KR.report}</span>
              <span className="kpi-value" style={{ fontSize: 20 }}>{formatKRW(summary.byType.report.amount)}</span>
              <span className="kpi-sub">{summary.byType.report.count}건</span>
            </Card>
            <Card padding="md">
              <span className="kpi-label">{TYPE_KR.service}</span>
              <span className="kpi-value" style={{ fontSize: 20 }}>{formatKRW(summary.byType.service.amount)}</span>
              <span className="kpi-sub">{summary.byType.service.count}건</span>
            </Card>
          </div>

          {/* Recent orders - DataGrid */}
          <DataGrid<OrderRow>
            columnDefs={orderColumnDefs}
            rowData={rows}
            searchFields={orderSearchFields}
            exportFileName="주문내역"
            title="최근 주문"
          />
        </>
      )}
    </AdminPage>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { AdminPage, Spinner } from '@hyliren/ui';
import { BOSidebar } from '@/components/BOSidebar';
import { PaymentsGrid } from './PaymentsGrid';
import { listPayments, type AdminPaymentListItem } from '@/lib/api/admin-payments';

const TYPE_LABELS: Record<string, string> = {
  report: '리포트 구매',
  service: '서비스 구매',
};
const STATUS_LABELS: Record<string, string> = {
  paid: '결제 완료',
  pending: '대기',
  refunded: '환불',
  cancelled: '취소',
};

interface PaymentRow {
  id: string;
  timestamp: string;
  type: string;
  actor: string;
  amount: number;
  status: string;
}

function toRow(p: AdminPaymentListItem): PaymentRow {
  return {
    id: p.id,
    timestamp: new Date(p.paidAt ?? p.createdAt).toLocaleString('ko'),
    type: TYPE_LABELS[p.type] || p.type,
    actor: `${p.actorName || p.actorId} (고객)`,
    amount: p.amount,
    status: STATUS_LABELS[p.status] || p.status,
  };
}

export default function PaymentsPage() {
  const [rows, setRows] = useState<PaymentRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    listPayments()
      .then((items) => { if (!cancelled) setRows(items.map(toRow)); })
      .catch((e: unknown) => {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : '결제 내역을 불러오지 못했습니다.');
      });
    return () => { cancelled = true; };
  }, []);

  return (
    <AdminPage sidebar={<BOSidebar active="/payments" />} title="결제 내역" prefix="bo">
      {error ? (
        <div style={{ padding: 24, color: 'var(--color-danger,#d72c0d)', fontSize: 13 }}>{error}</div>
      ) : rows === null ? (
        <div style={{ minHeight: 240, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Spinner />
        </div>
      ) : (
        <PaymentsGrid rows={rows} />
      )}
    </AdminPage>
  );
}

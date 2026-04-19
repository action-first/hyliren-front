import { getPayments } from '@hyliren/shared/src/server/data-store';
import { AdminPage } from '@hyliren/ui';
import { BOSidebar } from '@/components/BOSidebar';
import { PaymentsGrid } from './PaymentsGrid';

export const dynamic = 'force-dynamic';

const TYPE_LABELS: Record<string, string> = {
  credit_charge: '크레딧 충전', report_purchase: '리포트 구매', service_purchase: '서비스 구매',
};
const STATUS_LABELS: Record<string, string> = {
  paid: '결제 완료', pending: '대기', refunded: '환불',
};

export default function PaymentsPage() {
  const payments = getPayments();
  const rows = payments.map(p => ({
    id: p.id,
    timestamp: new Date(p.timestamp).toLocaleString('ko'),
    type: TYPE_LABELS[p.type] || p.type,
    actor: `${p.actorName || p.actorId} (${p.actorType === 'partner' ? '병원' : '고객'})`,
    amount: p.amount,
    status: STATUS_LABELS[p.status] || p.status,
  }));

  return (
    <AdminPage sidebar={<BOSidebar active="/payments" />} title="결제 내역" prefix="bo">
      <PaymentsGrid rows={rows} />
    </AdminPage>
  );
}

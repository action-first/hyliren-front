import { Card, Badge, SectionHeader } from '@hyliren/ui';
import { BOSidebar } from '@/components/BOSidebar';

// MVP: mock revenue data
const REVENUE_SUMMARY = [
  { label: '제안서 크레딧', amount: '1,245,000', count: 83 },
  { label: '검증 리포트', amount: '3,200,000', count: 24 },
  { label: '실행 서비스', amount: '5,800,000', count: 12 },
  { label: 'VIP 패키지', amount: '8,400,000', count: 4 },
];

const RECENT_ORDERS = [
  { id: 'o-001', type: 'report', buyer: '리리', concern: '눈 · 매몰쌍꺼풀', price: '150,000', status: 'paid', date: '2026-04-12' },
  { id: 'o-002', type: 'service', buyer: '메이', concern: '리프팅', price: '350,000', status: 'processing', date: '2026-04-11' },
  { id: 'o-003', type: 'report', buyer: '리리', concern: '눈 · 눈밑지방', price: '200,000', status: 'delivered', date: '2026-04-08' },
];

export default function RevenuePage() {
  const total = REVENUE_SUMMARY.reduce((sum, r) => sum + parseInt(r.amount.replace(/,/g, '')), 0);

  return (
    <div className="bo-layout">
      <BOSidebar active="/revenue" />
      <div className="bo-main">
        <div className="bo-topbar"><span className="bo-topbar-title">매출 현황</span></div>
        <div className="bo-content">
          {/* Total */}
          <Card padding="md" style={{ marginBottom: 'var(--space-6)' }}>
            <SectionHeader title="총 매출" />
            <div style={{ marginTop: 'var(--space-3)' }}>
              <span style={{ fontSize: 'var(--admin-text-h1)', fontWeight: 700, color: 'var(--admin-accent)' }}>
                ₩{total.toLocaleString()}
              </span>
            </div>
          </Card>

          {/* Revenue by type */}
          <div className="kpi-grid">
            {REVENUE_SUMMARY.map(r => (
              <Card key={r.label} padding="md">
                <span className="kpi-label">{r.label}</span>
                <span className="kpi-value" style={{ fontSize: 'var(--admin-text-h2)' }}>₩{r.amount}</span>
                <span className="kpi-label">{r.count}건</span>
              </Card>
            ))}
          </div>

          {/* Recent orders */}
          <Card padding="sm">
            <SectionHeader title="최근 주문" />
            <table className="data-table" style={{ marginTop: 'var(--space-4)' }}>
              <thead>
                <tr><th>유형</th><th>고객</th><th>고민</th><th>금액</th><th>상태</th><th>날짜</th></tr>
              </thead>
              <tbody>
                {RECENT_ORDERS.map(o => (
                  <tr key={o.id}>
                    <td><Badge variant={o.type === 'report' ? 'info' : 'default'}>{o.type}</Badge></td>
                    <td>{o.buyer}</td>
                    <td>{o.concern}</td>
                    <td style={{ fontWeight: 600 }}>₩{o.price}</td>
                    <td>
                      <Badge variant={
                        o.status === 'paid' ? 'success' :
                        o.status === 'processing' ? 'warning' : 'info'
                      }>{o.status}</Badge>
                    </td>
                    <td>{o.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </div>
      </div>
    </div>
  );
}

import { Card, Badge, Button, SectionHeader } from '@hyliren/ui';
import { POSidebar } from '@/components/POSidebar';

const MOCK_TRANSACTIONS = [
  { id: 1, date: '2026-04-10', reason: '크레딧 충전', amount: 50, balance: 50 },
  { id: 2, date: '2026-04-11', reason: '제안서 발송 (c-001)', amount: -3, balance: 47 },
  { id: 3, date: '2026-04-11', reason: '제안서 발송 (c-005)', amount: -3, balance: 44 },
];

export default function CreditsPage() {
  const balance = 44;

  return (
    <div className="po-layout">
      <POSidebar active="/credits" />
      <div className="po-main">
        <div className="po-topbar">
          <span className="po-topbar-title">크레딧 관리</span>
        </div>
        <div className="po-content">
          {/* Balance */}
          <Card padding="md" style={{ marginBottom: 'var(--space-6)' }}>
            <SectionHeader
              title="현재 잔액"
              action={<Button variant="primary" size="sm">크레딧 충전</Button>}
            />
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 'var(--space-2)', marginTop: 'var(--space-4)' }}>
              <span className="credit-balance">{balance}</span>
              <span className="credit-unit">크레딧</span>
            </div>
          </Card>

          {/* Transaction history */}
          <Card padding="sm">
            <SectionHeader title="거래 내역" />
            <table className="data-table" style={{ marginTop: 'var(--space-4)' }}>
              <thead>
                <tr>
                  <th>날짜</th>
                  <th>내용</th>
                  <th>변동</th>
                  <th>잔액</th>
                </tr>
              </thead>
              <tbody>
                {MOCK_TRANSACTIONS.map(tx => (
                  <tr key={tx.id}>
                    <td>{tx.date}</td>
                    <td>{tx.reason}</td>
                    <td style={{ color: tx.amount > 0 ? 'var(--color-success)' : 'var(--color-danger)', fontWeight: 600 }}>
                      {tx.amount > 0 ? '+' : ''}{tx.amount}
                    </td>
                    <td>{tx.balance}</td>
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

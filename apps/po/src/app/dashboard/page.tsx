import Link from 'next/link';
import { MOCK_CONCERNS, MOCK_PROPOSALS, MOCK_MEMBERS } from '@hyliren/shared';
import { Card, Badge, Button, SectionHeader } from '@hyliren/ui';
import { POSidebar } from '@/components/POSidebar';

export default function DashboardPage() {
  const currentMember = MOCK_MEMBERS.find(m => m.id === 'm-001')!;
  const openConcerns = MOCK_CONCERNS.filter(c => c.status === 'submitted' || c.status === 'proposal_received');
  const myProposals = MOCK_PROPOSALS.filter(p => p.memberId === currentMember.id && p.isActive);
  const sentCount = myProposals.filter(p => p.status !== 'draft').length;

  return (
    <div className="po-layout">
      <POSidebar active="/dashboard" />
      <div className="po-main">
        <div className="po-topbar">
          <span className="po-topbar-title">대시보드</span>
          <span className="text-sm text-[var(--color-text-secondary)]">{currentMember.name}</span>
        </div>
        <div className="po-content">
          {/* KPI */}
          <div className="kpi-grid">
            <Card padding="md">
              <span className="kpi-label">새 고민</span>
              <span className="kpi-value">{openConcerns.length}</span>
            </Card>
            <Card padding="md">
              <span className="kpi-label">발송 제안서</span>
              <span className="kpi-value">{sentCount}</span>
            </Card>
            <Card padding="md">
              <span className="kpi-label">크레딧 잔액</span>
              <span className="kpi-value">47</span>
            </Card>
            <Card padding="md">
              <span className="kpi-label">열람률</span>
              <span className="kpi-value">72%</span>
            </Card>
          </div>

          {/* Recent concerns */}
          <Card padding="md">
            <SectionHeader
              title="최근 고민"
              action={<Link href="/concerns"><Button variant="ghost" size="sm">전체보기</Button></Link>}
            />
            <table className="data-table mt-4">
              <thead>
                <tr>
                  <th>부위</th>
                  <th>상세</th>
                  <th>예산</th>
                  <th>방문 시기</th>
                  <th>상태</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {openConcerns.slice(0, 5).map(c => (
                  <tr key={c.id}>
                    <td><Badge variant="info">{c.primaryArea}</Badge></td>
                    <td>{c.bodyAreaDetail || '-'}</td>
                    <td>{c.budgetMin}~{c.budgetMax}만</td>
                    <td>{c.visitDateFrom ? c.visitDateFrom.slice(5) : '-'}</td>
                    <td><Badge>{c.status}</Badge></td>
                    <td>
                      <Link href={`/concerns/${c.id}`} className="data-table-link">보기</Link>
                    </td>
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

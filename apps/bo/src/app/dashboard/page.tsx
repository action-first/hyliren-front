import { MOCK_CONCERNS, MOCK_PROPOSALS, MOCK_MEMBERS, MOCK_USERS } from '@hyliren/shared';
import { Card, Badge, SectionHeader } from '@hyliren/ui';
import { BOSidebar } from '@/components/BOSidebar';

export default function DashboardPage() {
  const buyers = MOCK_USERS.filter(u => u.role === 'buyer');
  const partners = MOCK_MEMBERS.filter(m => m.role === 'partner');
  const concerns = MOCK_CONCERNS.filter(c => !c.deletedAt);
  const proposals = MOCK_PROPOSALS.filter(p => p.isActive);

  // Funnel counts
  const funnel = [
    { label: '고민 등록', value: concerns.filter(c => c.status !== 'draft').length },
    { label: '제안서 발송', value: proposals.filter(p => p.status !== 'draft').length },
    { label: '비교 중', value: concerns.filter(c => c.status === 'comparing').length },
    { label: '병원 선택', value: concerns.filter(c => c.status === 'hospital_selected' || c.status === 'service_purchased' || c.status === 'completed').length },
  ];

  return (
    <div className="bo-layout">
      <BOSidebar active="/dashboard" />
      <div className="bo-main">
        <div className="bo-topbar">
          <span className="bo-topbar-title">통합 대시보드</span>
        </div>
        <div className="bo-content">
          {/* KPI */}
          <div className="kpi-grid">
            <Card padding="md">
              <span className="kpi-value">{buyers.length}</span>
              <span className="kpi-label">총 고객</span>
            </Card>
            <Card padding="md">
              <span className="kpi-value">{partners.length}</span>
              <span className="kpi-label">파트너 병원</span>
            </Card>
            <Card padding="md">
              <span className="kpi-value">{concerns.length}</span>
              <span className="kpi-label">총 고민</span>
            </Card>
            <Card padding="md">
              <span className="kpi-value">{proposals.length}</span>
              <span className="kpi-label">총 제안서</span>
            </Card>
          </div>

          {/* Funnel */}
          <Card padding="md" style={{ marginBottom: 'var(--space-6)' }}>
            <SectionHeader title="전환 퍼널" />
            <div className="funnel-bar" style={{ marginTop: 'var(--space-4)' }}>
              {funnel.map((f, i) => (
                <div key={f.label} style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                  <div className="funnel-segment">
                    <span className="funnel-segment-value">{f.value}</span>
                    <span className="funnel-segment-label">{f.label}</span>
                  </div>
                  {i < funnel.length - 1 && <span className="funnel-arrow">→</span>}
                </div>
              ))}
            </div>
          </Card>

          {/* Status Distribution */}
          <Card padding="md">
            <SectionHeader title="고민 상태 분포" />
            <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap', marginTop: 'var(--space-4)' }}>
              {['submitted', 'proposal_received', 'comparing', 'hospital_selected', 'completed'].map(status => {
                const count = concerns.filter(c => c.status === status).length;
                return (
                  <Badge key={status} variant={count > 0 ? 'info' : 'default'}>
                    {status}: {count}
                  </Badge>
                );
              })}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

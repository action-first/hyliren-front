import { MOCK_CONCERNS, MOCK_PROPOSALS, MOCK_MEMBERS, MOCK_USERS } from '@hyliren/shared';
import { Card, Badge, SectionHeader } from '@hyliren/ui';
import { BOSidebar } from '@/components/BOSidebar';

const STATUS_LABELS: Record<string, string> = {
  submitted: '등록',
  proposal_received: '제안 도착',
  comparing: '비교 중',
  hospital_selected: '병원 선택',
  completed: '완료',
};

export default function DashboardPage() {
  const buyers = MOCK_USERS.filter(u => u.role === 'buyer');
  const partners = MOCK_MEMBERS.filter(m => m.role === 'partner');
  const concerns = MOCK_CONCERNS.filter(c => !c.deletedAt);
  const proposals = MOCK_PROPOSALS.filter(p => p.isActive);

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
              <span className="kpi-label">총 고객</span>
              <span className="kpi-value">{buyers.length}</span>
            </Card>
            <Card padding="md">
              <span className="kpi-label">파트너 병원</span>
              <span className="kpi-value">{partners.length}</span>
            </Card>
            <Card padding="md">
              <span className="kpi-label">총 고민</span>
              <span className="kpi-value">{concerns.length}</span>
            </Card>
            <Card padding="md">
              <span className="kpi-label">총 제안서</span>
              <span className="kpi-value">{proposals.length}</span>
            </Card>
          </div>

          {/* Funnel */}
          <Card padding="md" className="mb-6">
            <SectionHeader title="전환 퍼널" />
            <div className="funnel-bar mt-4">
              {funnel.map((f, i) => (
                <div key={f.label} className="flex items-center flex-1">
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
            <div className="flex gap-2 flex-wrap mt-4">
              {['submitted', 'proposal_received', 'comparing', 'hospital_selected', 'completed'].map(status => {
                const count = concerns.filter(c => c.status === status).length;
                return (
                  <Badge key={status} variant={count > 0 ? 'info' : 'default'}>
                    {STATUS_LABELS[status] || status}: {count}
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

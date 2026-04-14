import { MOCK_PROPOSALS, MOCK_CONCERNS, MOCK_MEMBERS, MOCK_PARTNER_PROFILES } from '@hyliren/shared';
import { Card, Badge, SectionHeader } from '@hyliren/ui';
import { BOSidebar } from '@/components/BOSidebar';

export default function ProposalsPage() {
  const proposals = MOCK_PROPOSALS.filter(p => p.isActive)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <div className="bo-layout">
      <BOSidebar active="/proposals" />
      <div className="bo-main">
        <div className="bo-topbar"><span className="bo-topbar-title">제안서 관리</span></div>
        <div className="bo-content">
          <SectionHeader title={`${proposals.length}건의 제안서`} />
          <Card padding="sm" className="mt-4">
            <table className="data-table">
              <thead>
                <tr><th>고민</th><th>병원</th><th>가격</th><th>회복</th><th>마취</th><th>상태</th><th>품질</th><th>발송일</th></tr>
              </thead>
              <tbody>
                {proposals.map(p => {
                  const concern = MOCK_CONCERNS.find(c => c.id === p.concernId);
                  const profile = MOCK_PARTNER_PROFILES.find(pp => pp.memberId === p.memberId);
                  return (
                    <tr key={p.id}>
                      <td><Badge variant="info">{concern?.primaryArea || '-'}</Badge></td>
                      <td className="font-medium">{profile?.hospitalName || '-'}</td>
                      <td className="font-semibold">{p.totalPrice}만</td>
                      <td>{p.recoveryDays}일</td>
                      <td>{p.anesthesiaType}</td>
                      <td>
                        <Badge variant={
                          p.status === 'selected' ? 'success' :
                          p.status === 'shortlisted' ? 'info' :
                          p.status === 'rejected' ? 'danger' : 'default'
                        }>{p.status}</Badge>
                      </td>
                      <td>{p.qualityScore ?? '-'}</td>
                      <td>{p.sentAt ? new Date(p.sentAt).toLocaleDateString('ko') : '-'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Card>
        </div>
      </div>
    </div>
  );
}

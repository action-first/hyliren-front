import { MOCK_PROPOSALS, MOCK_MEMBERS, MOCK_PARTNER_PROFILES, MOCK_CONCERNS } from '@hyliren/shared';
import { Card, Badge, SectionHeader } from '@hyliren/ui';
import { POSidebar } from '@/components/POSidebar';

export default function ProposalListPage() {
  const currentMember = MOCK_MEMBERS.find(m => m.id === 'm-001')!;
  const myProposals = MOCK_PROPOSALS
    .filter(p => p.memberId === currentMember.id && p.isActive)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <div className="po-layout">
      <POSidebar active="/proposals" />
      <div className="po-main">
        <div className="po-topbar">
          <span className="po-topbar-title">발송 내역</span>
        </div>
        <div className="po-content">
          <SectionHeader title={`${myProposals.length}건의 제안서`} />

          <Card padding="sm" className="mt-4">
            <table className="data-table">
              <thead>
                <tr>
                  <th>고민</th>
                  <th>가격</th>
                  <th>회복</th>
                  <th>마취</th>
                  <th>상태</th>
                  <th>발송일</th>
                  <th>열람일</th>
                </tr>
              </thead>
              <tbody>
                {myProposals.map(p => {
                  const concern = MOCK_CONCERNS.find(c => c.id === p.concernId);
                  return (
                    <tr key={p.id}>
                      <td>
                        <Badge variant="info">{concern?.bodyArea || '-'}</Badge>
                        {' '}{concern?.bodyAreaDetail || ''}
                      </td>
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
                      <td>{p.sentAt ? new Date(p.sentAt).toLocaleDateString('ko') : '-'}</td>
                      <td>{p.viewedAt ? new Date(p.viewedAt).toLocaleDateString('ko') : '미열람'}</td>
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

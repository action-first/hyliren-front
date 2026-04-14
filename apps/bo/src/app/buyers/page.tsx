import Link from 'next/link';
import { MOCK_USERS, MOCK_BUYER_PROFILES, MOCK_CONCERNS } from '@hyliren/shared';
import { Card, Badge, SectionHeader } from '@hyliren/ui';
import { BOSidebar } from '@/components/BOSidebar';

export default function BuyersPage() {
  const buyers = MOCK_USERS.filter(u => u.role === 'buyer');

  return (
    <div className="bo-layout">
      <BOSidebar active="/buyers" />
      <div className="bo-main">
        <div className="bo-topbar">
          <span className="bo-topbar-title">고객 관리</span>
        </div>
        <div className="bo-content">
          <SectionHeader title={`${buyers.length}명의 고객`} />
          <Card padding="sm" style={{ marginTop: 'var(--space-4)' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>이름</th>
                  <th>연락처</th>
                  <th>언어</th>
                  <th>고민 수</th>
                  <th>최신 상태</th>
                  <th>가입일</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {buyers.map(user => {
                  const profile = MOCK_BUYER_PROFILES.find(p => p.userId === user.id);
                  const userConcerns = MOCK_CONCERNS.filter(c => c.userId === user.id && !c.deletedAt);
                  const latest = userConcerns.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())[0];
                  return (
                    <tr key={user.id}>
                      <td style={{ fontWeight: 500 }}>{user.name}</td>
                      <td>{user.phone || user.email || '-'}</td>
                      <td><Badge>{user.locale}</Badge></td>
                      <td>{userConcerns.length}</td>
                      <td>{latest ? <Badge variant="info">{latest.status}</Badge> : '-'}</td>
                      <td>{new Date(user.createdAt).toLocaleDateString('ko')}</td>
                      <td><Link href={`/buyers/${user.id}`} className="data-table-link">상세</Link></td>
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

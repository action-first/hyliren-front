import { MOCK_MEMBERS, MOCK_PARTNER_PROFILES, MOCK_PROPOSALS } from '@hyliren/shared';
import { Card, Badge, SectionHeader } from '@hyliren/ui';
import { BOSidebar } from '@/components/BOSidebar';

export default function PartnersPage() {
  const partners = MOCK_MEMBERS.filter(m => m.role === 'partner');

  return (
    <div className="bo-layout">
      <BOSidebar active="/partners" />
      <div className="bo-main">
        <div className="bo-topbar"><span className="bo-topbar-title">병원 관리</span></div>
        <div className="bo-content">
          <SectionHeader title={`${partners.length}개 파트너 병원`} />
          <Card padding="sm" className="mt-4">
            <table className="data-table">
              <thead>
                <tr><th>병원명</th><th>전문분야</th><th>인증</th><th>제안서 수</th><th>선택률</th></tr>
              </thead>
              <tbody>
                {partners.map(m => {
                  const profile = MOCK_PARTNER_PROFILES.find(p => p.memberId === m.id);
                  const proposals = MOCK_PROPOSALS.filter(p => p.memberId === m.id && p.isActive);
                  const selected = proposals.filter(p => p.status === 'selected').length;
                  const rate = proposals.length > 0 ? Math.round((selected / proposals.length) * 100) : 0;
                  return (
                    <tr key={m.id}>
                      <td className="font-medium">{profile?.hospitalName || m.name}</td>
                      <td>
                        {profile?.specialties.map(s => <span key={s} className="mr-1 inline-block"><Badge variant="info">{s}</Badge></span>)}
                      </td>
                      <td>{profile?.verified ? <Badge variant="success">인증</Badge> : <Badge variant="warning">미인증</Badge>}</td>
                      <td>{proposals.length}</td>
                      <td>{rate}%</td>
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

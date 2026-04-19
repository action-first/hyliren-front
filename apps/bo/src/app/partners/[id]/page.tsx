import { notFound } from 'next/navigation';
import { MOCK_MEMBERS, MOCK_PARTNER_PROFILES, PROPOSAL_STATUS_KR, ANESTHESIA_KR, formatDateKR } from '@hyliren/shared';
import { getProposals } from '@hyliren/shared/src/server/data-store';
import { Card, Badge, SectionHeader, AdminPage } from '@hyliren/ui';
import { BOSidebar } from '@/components/BOSidebar';

export const dynamic = 'force-dynamic';

interface Props { params: Promise<{ id: string }> }

export default async function PartnerDetailPage({ params }: Props) {
  const { id } = await params;
  const member = MOCK_MEMBERS.find(m => m.id === id);
  if (!member) notFound();

  const profile = MOCK_PARTNER_PROFILES.find(p => p.memberId === id);
  const proposals = getProposals().filter(p => p.memberId === id && p.isActive);
  const selectedCount = proposals.filter(p => p.status === 'selected').length;
  const viewedCount = proposals.filter(p => p.viewedAt).length;
  const selectRate = proposals.length > 0 ? Math.round((selectedCount / proposals.length) * 100) : 0;
  const viewRate = proposals.length > 0 ? Math.round((viewedCount / proposals.length) * 100) : 0;

  return (
    <AdminPage
      sidebar={<BOSidebar active="/partners" />}
      title={profile?.hospitalName || member.name}
      prefix="bo"
      actions={
        profile?.verified
          ? <Badge variant="success">인증 완료</Badge>
          : <Badge variant="warning">미인증</Badge>
      }
    >
      {/* KPI */}
      <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: 20 }}>
        <Card padding="md">
          <span className="kpi-label">발송 제안서</span>
          <span className="kpi-value">{proposals.length}</span>
        </Card>
        <Card padding="md">
          <span className="kpi-label">열람률</span>
          <span className="kpi-value">{viewRate}%</span>
        </Card>
        <Card padding="md">
          <span className="kpi-label">선택률</span>
          <span className="kpi-value">{selectRate}%</span>
        </Card>
        <Card padding="md">
          <span className="kpi-label">선택 건수</span>
          <span className="kpi-value">{selectedCount}</span>
        </Card>
      </div>

      {/* 프로필 */}
      <Card padding="md" className="mb-5">
        <SectionHeader title="병원 정보" />
        <div className="grid grid-cols-3 gap-4 mt-4">
          <div>
            <p style={{ fontSize: 12, color: '#9ca3af', marginBottom: 4 }}>병원명</p>
            <p style={{ fontSize: 14, fontWeight: 500 }}>{profile?.hospitalName || '—'}</p>
          </div>
          <div>
            <p style={{ fontSize: 12, color: '#9ca3af', marginBottom: 4 }}>병원명 (중국어)</p>
            <p style={{ fontSize: 14 }}>{profile?.hospitalNameZh || '—'}</p>
          </div>
          <div>
            <p style={{ fontSize: 12, color: '#9ca3af', marginBottom: 4 }}>전문 분야</p>
            <div className="flex gap-1 flex-wrap">
              {profile?.specialties.map(s => <Badge key={s} variant="info">{s}</Badge>)}
            </div>
          </div>
          <div>
            <p style={{ fontSize: 12, color: '#9ca3af', marginBottom: 4 }}>전화</p>
            <p style={{ fontSize: 14 }}>{profile?.phone || '—'}</p>
          </div>
          <div>
            <p style={{ fontSize: 12, color: '#9ca3af', marginBottom: 4 }}>웹사이트</p>
            <p style={{ fontSize: 14 }}>{profile?.website || '—'}</p>
          </div>
          <div>
            <p style={{ fontSize: 12, color: '#9ca3af', marginBottom: 4 }}>주소</p>
            <p style={{ fontSize: 14 }}>{profile?.address || '—'}</p>
          </div>
        </div>
      </Card>

      {/* 제안서 내역 */}
      <Card padding="sm">
        <SectionHeader title={`제안서 내역 ${proposals.length}건`} />
        <table className="data-table mt-4">
          <thead>
            <tr><th>가격</th><th>회복</th><th>마취</th><th>상태</th><th>발송일</th><th>열람</th></tr>
          </thead>
          <tbody>
            {proposals.length === 0 && (
              <tr><td colSpan={6} style={{ textAlign: 'center', padding: '24px 0', color: '#9ca3af', fontSize: 13 }}>제안서가 없습니다</td></tr>
            )}
            {proposals.map(p => (
              <tr key={p.id}>
                <td style={{ fontWeight: 600 }}>{p.totalPrice}만</td>
                <td>{p.recoveryDays}일</td>
                <td>{ANESTHESIA_KR[p.anesthesiaType] ?? p.anesthesiaType}</td>
                <td>
                  <Badge variant={p.status === 'selected' ? 'success' : p.status === 'shortlisted' ? 'info' : 'default'}>
                    {PROPOSAL_STATUS_KR[p.status] ?? p.status}
                  </Badge>
                </td>
                <td style={{ fontSize: 13, color: '#9ca3af' }}>{formatDateKR(p.sentAt)}</td>
                <td style={{ fontSize: 13, color: '#9ca3af' }}>{p.viewedAt ? formatDateKR(p.viewedAt) : '미열람'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </AdminPage>
  );
}

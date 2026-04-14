import Link from 'next/link';
import { MOCK_CONCERNS, MOCK_CONCERN_PHOTOS, MOCK_PROPOSALS, MOCK_PROPOSAL_ITEMS } from '@hyliren/shared';
import { Card, Badge, Button, SectionHeader } from '@hyliren/ui';
import { POSidebar } from '@/components/POSidebar';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ConcernDetailPage({ params }: Props) {
  const { id } = await params;
  const concern = MOCK_CONCERNS.find(c => c.id === id) || MOCK_CONCERNS[0];
  const photos = MOCK_CONCERN_PHOTOS.filter(p => p.concernId === concern.id);
  const existingProposals = MOCK_PROPOSALS.filter(p => p.concernId === concern.id && p.isActive);

  return (
    <div className="po-layout">
      <POSidebar active="/concerns" />
      <div className="po-main">
        <div className="po-topbar">
          <span className="po-topbar-title">고민 상세</span>
          <Link href={`/concerns/${concern.id}/propose`}>
            <Button variant="primary" size="sm">제안서 작성</Button>
          </Link>
        </div>
        <div className="po-content">
          {/* Status */}
          <div style={{ marginBottom: 'var(--space-4)', display: 'flex', gap: 'var(--space-2)' }}>
            <Badge variant="info">{concern.bodyArea}</Badge>
            {concern.bodyAreaDetail && <Badge>{concern.bodyAreaDetail}</Badge>}
            <Badge variant={concern.status === 'submitted' ? 'warning' : 'success'}>{concern.status}</Badge>
          </div>

          {/* Photos */}
          {photos.length > 0 && (
            <div className="concern-photos-row">
              {photos.map(p => (
                <div key={p.id} className="concern-photo-thumb">📷</div>
              ))}
            </div>
          )}

          {/* Details */}
          <Card padding="md" style={{ marginBottom: 'var(--space-6)' }}>
            <SectionHeader title="고민 정보" />
            <div className="concern-detail-grid" style={{ marginTop: 'var(--space-4)' }}>
              <div>
                <div className="concern-detail-label">고민 내용</div>
                <div className="concern-detail-value">{concern.description}</div>
              </div>
              <div>
                <div className="concern-detail-label">예산</div>
                <div className="concern-detail-value">{concern.budgetMin}만 ~ {concern.budgetMax}만원</div>
              </div>
              <div>
                <div className="concern-detail-label">방문 시기</div>
                <div className="concern-detail-value">
                  {concern.visitDateFrom ? `${concern.visitDateFrom} ~ ${concern.visitDateTo}` : '미정'}
                </div>
              </div>
              <div>
                <div className="concern-detail-label">여권</div>
                <div className="concern-detail-value">{concern.hasPassport ? '보유' : '미보유'}</div>
              </div>
            </div>
          </Card>

          {/* Existing proposals */}
          {existingProposals.length > 0 && (
            <Card padding="md">
              <SectionHeader title={`기존 제안서 ${existingProposals.length}건`} />
              <table className="data-table" style={{ marginTop: 'var(--space-4)' }}>
                <thead>
                  <tr>
                    <th>병원</th>
                    <th>가격</th>
                    <th>회복</th>
                    <th>마취</th>
                    <th>상태</th>
                  </tr>
                </thead>
                <tbody>
                  {existingProposals.map(p => (
                    <tr key={p.id}>
                      <td>{p.memberId}</td>
                      <td>{p.totalPrice}만</td>
                      <td>{p.recoveryDays}일</td>
                      <td>{p.anesthesiaType}</td>
                      <td><Badge variant={p.status === 'shortlisted' ? 'info' : 'default'}>{p.status}</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

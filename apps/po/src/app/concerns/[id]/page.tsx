import Link from 'next/link';
import { notFound } from 'next/navigation';
import { MOCK_PARTNER_PROFILES, CONCERN_STATUS_KR, ANESTHESIA_KR, formatBudget, formatDateRange } from '@hyliren/shared';
import { getConcerns, getConcernPhotos, getProposals } from '@hyliren/shared/src/server/data-store';
import { Card, Badge, Button, SectionHeader, AdminPage } from '@hyliren/ui';
import { POSidebar } from '@/components/POSidebar';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ConcernDetailPage({ params }: Props) {
  const { id } = await params;
  const concern = getConcerns().find(c => c.id === id);
  if (!concern) notFound();
  const photos = getConcernPhotos().filter(p => p.concernId === concern.id);
  const existingProposals = getProposals().filter(p => p.concernId === concern.id && p.isActive);

  return (
    <AdminPage
      sidebar={<POSidebar active="/concerns" />}
      title="고민 상세"
      prefix="po"
      actions={
        <Link href={`/concerns/${concern.id}/propose`}>
          <Button variant="accent" size="sm">제안서 작성</Button>
        </Link>
      }
    >
      {/* Status */}
      <div className="mb-4 flex gap-2">
        <Badge variant="info">{concern.primaryArea}</Badge>
        {concern.bodyAreaDetail && <Badge>{concern.bodyAreaDetail}</Badge>}
        <Badge variant={concern.status === 'submitted' ? 'warning' : 'success'}>
          {CONCERN_STATUS_KR[concern.status] ?? concern.status}
        </Badge>
      </div>

      {/* Photos */}
      {photos.length > 0 && (
        <div className="concern-photos-row">
          {photos.map(p => (
            <div key={p.id} className="concern-photo-thumb" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>
              <span style={{ color: '#9ca3af' }}>IMG</span>
            </div>
          ))}
        </div>
      )}

      {/* Details */}
      <Card padding="md" className="mb-6">
        <SectionHeader title="고민 정보" />
        <p style={{ fontSize: 14, color: '#374151', lineHeight: 1.6, margin: '12px 0 16px' }}>{concern.description}</p>
        <div className="detail-grid-3col">
          <div>
            <div className="concern-detail-label">예산</div>
            <div className="concern-detail-value">{formatBudget(concern.budgetMin, concern.budgetMax)}</div>
          </div>
          <div>
            <div className="concern-detail-label">방문 시기</div>
            <div className="concern-detail-value">{formatDateRange(concern.visitDateFrom, concern.visitDateTo)}</div>
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
          <table className="data-table mt-4">
            <thead>
              <tr><th>병원</th><th>가격</th><th>회복</th><th>마취</th><th>상태</th></tr>
            </thead>
            <tbody>
              {existingProposals.map(p => (
                <tr key={p.id}>
                  <td>{MOCK_PARTNER_PROFILES.find(pp => pp.memberId === p.memberId)?.hospitalName ?? p.memberId}</td>
                  <td>{p.totalPrice}만</td>
                  <td>{p.recoveryDays}일</td>
                  <td>{ANESTHESIA_KR[p.anesthesiaType] ?? p.anesthesiaType}</td>
                  <td><Badge variant={p.status === 'shortlisted' ? 'info' : 'default'}>{p.status}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </AdminPage>
  );
}

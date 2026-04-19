import Link from 'next/link';
import { notFound } from 'next/navigation';
import { MOCK_PARTNER_PROFILES, PROPOSAL_STATUS_KR, ANESTHESIA_KR, formatDateKR, formatDateRange } from '@hyliren/shared';
import { getConcerns, getProposals, getProposalItems } from '@hyliren/shared/src/server/data-store';
import { Card, Badge, Button, SectionHeader, AdminPage } from '@hyliren/ui';
import { POSidebar } from '@/components/POSidebar';
import { ArrowLeft } from 'lucide-react';

interface Props { params: Promise<{ id: string }> }

const TIMELINE_STEPS = ['sent', 'viewed', 'shortlisted', 'selected'] as const;
const TIMELINE_LABELS: Record<string, string> = {
  sent: '발송', viewed: '열람', shortlisted: '후보', selected: '선택',
};

const STATUS_VARIANT: Record<string, 'success' | 'info' | 'danger' | 'warning' | 'default'> = {
  selected: 'success', shortlisted: 'info', rejected: 'danger', viewed: 'warning', sent: 'default', draft: 'default',
};

function getStepIndex(status: string): number {
  const idx = TIMELINE_STEPS.indexOf(status as typeof TIMELINE_STEPS[number]);
  return idx >= 0 ? idx : 0;
}

export default async function ProposalDetailPage({ params }: Props) {
  const { id } = await params;
  const proposal = getProposals().find(p => p.id === id);
  if (!proposal) notFound();

  const items = getProposalItems().filter(i => i.proposalId === id);
  const concern = getConcerns().find(c => c.id === proposal.concernId);
  const currentStep = getStepIndex(proposal.status);

  return (
    <AdminPage
      sidebar={<POSidebar active="/proposals" />}
      title={`제안서 상세 — ${concern ? `${concern.primaryArea} ${concern.bodyAreaDetail ?? ''}` : ''}`}
      prefix="po"
      actions={
        <Badge variant={STATUS_VARIANT[proposal.status] ?? 'default'}>
          {PROPOSAL_STATUS_KR[proposal.status] ?? proposal.status}
        </Badge>
      }
    >
      {/* 상태 타임라인 */}
      <Card padding="md" className="mb-5">
        <div className="flex items-center gap-1">
          {TIMELINE_STEPS.map((step, i) => (
            <div key={step} className="flex items-center gap-1 flex-1">
              <div className={`flex items-center gap-1.5 ${i <= currentStep ? 'text-[var(--color-primary)]' : 'text-[var(--color-text-dim)]'}`}>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold ${
                  i <= currentStep ? 'bg-[var(--color-primary)] text-white' : 'bg-[var(--color-bg-tertiary)]'
                }`}>
                  {i + 1}
                </div>
                <span className={`text-[12px] ${i <= currentStep ? 'font-semibold' : ''}`}>{TIMELINE_LABELS[step]}</span>
              </div>
              {i < TIMELINE_STEPS.length - 1 && (
                <div className={`flex-1 h-0.5 mx-1 ${i < currentStep ? 'bg-[var(--color-primary)]' : 'bg-[var(--color-bg-tertiary)]'}`} />
              )}
            </div>
          ))}
        </div>
      </Card>

      <div className="propose-form">
        {/* 시술 항목 */}
        <Card padding="md">
          <SectionHeader title="시술 항목" />
          {items.length > 0 ? (
            <table className="data-table mt-4">
              <thead>
                <tr><th>시술명</th><th>중국어</th><th>가격</th></tr>
              </thead>
              <tbody>
                {items.map((item, i) => (
                  <tr key={item.id ?? i}>
                    <td className="font-medium">{item.treatmentName}</td>
                    <td style={{ color: '#6b7280' }}>{item.treatmentNameZh ?? '—'}</td>
                    <td>{item.price}만원</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p style={{ color: '#9ca3af', fontSize: 13, marginTop: 16 }}>항목 정보 없음</p>
          )}
          <div className="propose-total-row mt-4 pt-4 border-t border-[var(--color-border-light)]">
            <span className="propose-total-label">총 예상 비용</span>
            <div className="flex items-baseline gap-2">
              <span style={{ fontSize: 24, fontWeight: 700, color: '#2C6ECB' }}>{proposal.totalPrice}</span>
              <span style={{ color: '#6b7280' }}>만원</span>
            </div>
          </div>
        </Card>

        {/* 시술 정보 */}
        <Card padding="md">
          <SectionHeader title="시술 정보" />
          <div className="detail-grid-3col mt-4">
            <div>
              <p className="concern-detail-label">회복 기간</p>
              <p className="concern-detail-value">{proposal.recoveryDays}일</p>
            </div>
            <div>
              <p className="concern-detail-label">마취 유형</p>
              <p className="concern-detail-value">{ANESTHESIA_KR[proposal.anesthesiaType] ?? proposal.anesthesiaType}</p>
            </div>
            <div>
              <p className="concern-detail-label">입원 기간</p>
              <p className="concern-detail-value">{proposal.hospitalStayDays}일</p>
            </div>
            <div>
              <p className="concern-detail-label">시술 가능 기간</p>
              <p className="concern-detail-value">{formatDateRange(proposal.availableDateFrom, proposal.availableDateTo)}</p>
            </div>
            <div>
              <p className="concern-detail-label">발송일시</p>
              <p className="concern-detail-value">{formatDateKR(proposal.sentAt)}</p>
            </div>
            <div>
              <p className="concern-detail-label">열람일시</p>
              <p className="concern-detail-value">{proposal.viewedAt ? formatDateKR(proposal.viewedAt) : '미열람'}</p>
            </div>
          </div>
          {proposal.consultationNote && (
            <>
              <div style={{ borderTop: '1px solid #f1f5f9', margin: '16px 0' }} />
              <SectionHeader title="부연 설명" />
              <p style={{ fontSize: 14, color: '#374151', marginTop: 12, lineHeight: 1.6 }}>{proposal.consultationNote}</p>
            </>
          )}
        </Card>
      </div>
    </AdminPage>
  );
}

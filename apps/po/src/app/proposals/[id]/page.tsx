'use client';

import { useEffect, useState, use } from 'react';
import { notFound } from 'next/navigation';
import {
  PROPOSAL_STATUS_KR, PROPOSAL_STATUS_BADGE,
  ANESTHESIA_KR, CONCERN_STATUS_KR,
  formatDateKR, formatDateRange, formatBudget,
  CREDIT_COST,
} from '@hyliren/shared';
import { Card, Badge, SectionHeader, AdminPage, Spinner } from '@hyliren/ui';
import { POSidebar } from '@/components/POSidebar';
import { getConcern, type ConcernDetailWire } from '@/lib/api/concern';
import { formatKrwAsMan, listMyProposals, type ProposalDetailWire } from '@/lib/api/proposal';
import { ApiError } from '@/lib/api/errors';

const S = {
  label: { fontSize: 13, color: '#94a3b8', marginBottom: 2 } as const,
  value: { fontSize: 14, color: '#0f172a', fontWeight: 500 } as const,
  metaRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' } as const,
  divider: { height: 1, background: '#f1f5f9', margin: 0, border: 0 } as const,
};

function MetaRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={S.metaRow}>
      <span style={S.label}>{label}</span>
      <span style={S.value}>{children}</span>
    </div>
  );
}

function StatusBadge({ label, map }: { label: string; map: Record<string, { bg: string; text: string }> }) {
  const c = map[label];
  if (!c) return <Badge>{label}</Badge>;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 500,
      backgroundColor: c.bg, color: c.text,
    }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: c.text, opacity: 0.5 }} />
      {label}
    </span>
  );
}

const TIMELINE_STEPS = ['sent', 'viewed', 'shortlisted', 'selected'] as const;
const TIMELINE_LABELS: Record<string, string> = {
  sent: '발송', viewed: '열람', shortlisted: '후보', selected: '선택',
};

function getStepIndex(status: string): number {
  const idx = TIMELINE_STEPS.indexOf(status as typeof TIMELINE_STEPS[number]);
  return idx >= 0 ? idx : 0;
}

interface Props { params: Promise<{ id: string }> }

export default function ProposalDetailPage({ params }: Props) {
  const { id } = use(params);
  const [proposal, setProposal] = useState<ProposalDetailWire | null>(null);
  const [concern, setConcern] = useState<ConcernDetailWire | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFoundError, setNotFoundError] = useState(false);

  useEffect(() => {
    listMyProposals()
      .then(async (data) => {
        const found = data.proposals.find(p => p.id === id);
        if (!found) {
          setNotFoundError(true);
          setLoading(false);
          return;
        }

        setProposal(found);
        try {
          setConcern(await getConcern(found.concernId));
        } catch (err) {
          if (!(err instanceof ApiError && err.status === 404)) {
            throw err;
          }
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <AdminPage sidebar={<POSidebar active="/activity" />} title="제안서 상세" prefix="po">
        <div className="flex items-center justify-center py-20"><Spinner /></div>
      </AdminPage>
    );
  }

  if (notFoundError || !proposal) {
    notFound();
  }

  const currentStep = getStepIndex(proposal.status);
  const statusLabel = PROPOSAL_STATUS_KR[proposal.status] ?? proposal.status;

  return (
    <AdminPage
      sidebar={<POSidebar active="/activity" />}
      title={`제안서 상세 — ${concern ? `${concern.primaryArea} ${concern.bodyAreaDetail ?? ''}` : ''}`}
      prefix="po"
      actions={<StatusBadge label={statusLabel} map={PROPOSAL_STATUS_BADGE} />}
    >
      <div className="detail-grid">
        <div className="detail-main">
          <Card padding="md">
            <div className="flex items-center gap-1">
              {TIMELINE_STEPS.map((step, i) => (
                <div key={step} className="flex items-center gap-1 flex-1">
                  <div className={`flex items-center gap-1.5 ${i <= currentStep ? 'text-[var(--color-primary)]' : 'text-[var(--color-text-dim)]'}`}>
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold ${
                      i <= currentStep ? 'bg-[var(--color-primary)] text-white' : 'bg-[var(--color-bg-tertiary)]'
                    }`}>{i + 1}</div>
                    <span className={`text-[12px] ${i <= currentStep ? 'font-semibold' : ''}`}>{TIMELINE_LABELS[step]}</span>
                  </div>
                  {i < TIMELINE_STEPS.length - 1 && (
                    <div className={`flex-1 h-0.5 mx-1 ${i < currentStep ? 'bg-[var(--color-primary)]' : 'bg-[var(--color-bg-tertiary)]'}`} />
                  )}
                </div>
              ))}
            </div>
          </Card>

          <Card padding="md">
            <SectionHeader title="시술 항목" />
            {proposal.items.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
                {proposal.items.map((item, i) => (
                  <div key={item.id ?? i} style={{
                    padding: '12px 16px', background: '#f8fafc', borderRadius: 8,
                    border: '1px solid #f1f5f9',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 500, color: '#0f172a' }}>{item.treatmentName}</div>
                      {item.treatmentNameZh && <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>{item.treatmentNameZh}</div>}
                    </div>
                    <span style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>{formatKrwAsMan(item.price)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: '#94a3b8', fontSize: 13, marginTop: 16 }}>항목 정보 없음</p>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, paddingTop: 16, borderTop: '1px solid #f1f5f9' }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: '#64748b' }}>총 예상 비용</span>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                <span style={{ fontSize: 24, fontWeight: 700, color: '#0f172a' }}>{formatKrwAsMan(proposal.totalPrice)}</span>
              </div>
            </div>
          </Card>

          <Card padding="md">
            <SectionHeader title="시술 정보" />
            <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px 24px' }}>
              <div>
                <div style={S.label}>회복 기간</div>
                <div style={S.value}>{proposal.recoveryDays}일</div>
              </div>
              <div>
                <div style={S.label}>마취 유형</div>
                <div style={S.value}>{ANESTHESIA_KR[proposal.anesthesiaType] ?? proposal.anesthesiaType}</div>
              </div>
              <div>
                <div style={S.label}>입원 기간</div>
                <div style={S.value}>{proposal.hospitalStayDays}일</div>
              </div>
              <div>
                <div style={S.label}>시술 가능 기간</div>
                <div style={S.value}>{formatDateRange(proposal.availableDateFrom, proposal.availableDateTo)}</div>
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

        <div className="detail-sticky-sidebar">
          <Card padding="md">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <MetaRow label="상태">
                <StatusBadge label={statusLabel} map={PROPOSAL_STATUS_BADGE} />
              </MetaRow>
              <hr style={S.divider} />
              <MetaRow label="발송일">{formatDateKR(proposal.sentAt)}</MetaRow>
              <MetaRow label="열람일">{proposal.viewedAt ? formatDateKR(proposal.viewedAt) : '미열람'}</MetaRow>
              <hr style={S.divider} />
              <MetaRow label="크레딧 차감">{CREDIT_COST}개</MetaRow>
            </div>
          </Card>

          {concern && (
            <Card padding="md">
              <SectionHeader title="연결된 고민" />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 12 }}>
                <MetaRow label="부위">{concern.primaryArea} {concern.bodyAreaDetail || ''}</MetaRow>
                <MetaRow label="예산">{formatBudget(concern.budgetMin, concern.budgetMax)}</MetaRow>
                <MetaRow label="방문 시기">{formatDateRange(concern.visitDateFrom, concern.visitDateTo)}</MetaRow>
                <MetaRow label="고민 상태">
                  <span style={{ fontSize: 12, color: '#64748b' }}>{CONCERN_STATUS_KR[concern.status] ?? concern.status}</span>
                </MetaRow>
              </div>
            </Card>
          )}
        </div>
      </div>
    </AdminPage>
  );
}

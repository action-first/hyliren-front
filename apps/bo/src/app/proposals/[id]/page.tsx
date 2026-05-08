'use client';

import { useEffect, useState, use } from 'react';
import {
  PROPOSAL_STATUS_KR, PROPOSAL_STATUS_BADGE,
  CONCERN_STATUS_KR, ANESTHESIA_KR,
  formatDateKR, formatDateRange, formatBudget, formatKRW,
} from '@hyliren/shared';
import { Card, Badge, SectionHeader, AdminPage, Spinner } from '@hyliren/ui';
import { BOSidebar } from '@/components/BOSidebar';
import { getProposalDetail, type AdminProposalDetail } from '@/lib/api/admin-proposals';
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

function StatusBadge({ statusKey, label, map }: { statusKey: string; label: string; map: Record<string, { bg: string; text: string }> }) {
  const c = map[statusKey];
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

interface Props { params: Promise<{ id: string }> }

export default function ProposalDetailPage({ params }: Props) {
  const { id } = use(params);
  const [data, setData] = useState<AdminProposalDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getProposalDetail(id)
      .then((d) => { if (!cancelled) setData(d); })
      .catch((e: unknown) => {
        if (cancelled) return;
        if (e instanceof ApiError && e.status === 404) {
          setNotFound(true);
          return;
        }
        setError(e instanceof Error ? e.message : '제안서 정보를 불러오지 못했습니다.');
      });
    return () => { cancelled = true; };
  }, [id]);

  if (notFound) {
    return (
      <AdminPage sidebar={<BOSidebar active="/proposals" />} title="제안서 상세" prefix="bo">
        <div style={{ padding: 24, fontSize: 14, color: '#475569' }}>존재하지 않는 제안서입니다.</div>
      </AdminPage>
    );
  }
  if (error) {
    return (
      <AdminPage sidebar={<BOSidebar active="/proposals" />} title="제안서 상세" prefix="bo">
        <div style={{ padding: 24, color: 'var(--color-danger,#d72c0d)', fontSize: 13 }}>{error}</div>
      </AdminPage>
    );
  }
  if (!data) {
    return (
      <AdminPage sidebar={<BOSidebar active="/proposals" />} title="제안서 상세" prefix="bo">
        <div style={{ minHeight: 240, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Spinner />
        </div>
      </AdminPage>
    );
  }

  const { proposal, items, concern, user, hospital } = data;
  const statusLabel = PROPOSAL_STATUS_KR[proposal.status] ?? proposal.status;

  return (
    <AdminPage
      sidebar={<BOSidebar active="/proposals" />}
      title={`제안서 상세 — ${concern?.primaryArea ?? ''} ${concern?.bodyAreaDetail ?? ''}`}
      prefix="bo"
      actions={<StatusBadge statusKey={proposal.status} label={statusLabel} map={PROPOSAL_STATUS_BADGE} />}
    >
      <div className="detail-grid">

        <div className="detail-main">

          {/* 시술 항목 */}
          <Card padding="md">
            <SectionHeader title="시술 항목" />
            {items.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
                {items.map((item, i) => (
                  <div key={item.id ?? i} style={{
                    padding: '12px 16px', background: '#f8fafc', borderRadius: 8,
                    border: '1px solid #f1f5f9',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 500, color: '#0f172a' }}>{item.treatmentName}</div>
                      {item.treatmentNameZh && <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>{item.treatmentNameZh}</div>}
                    </div>
                    <span style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>{formatKRW(item.price)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: '#94a3b8', fontSize: 13, marginTop: 16 }}>항목 정보 없음</p>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, paddingTop: 16, borderTop: '1px solid #f1f5f9' }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: '#64748b' }}>총 예상 비용</span>
              <span style={{ fontSize: 24, fontWeight: 700, color: '#0f172a' }}>{formatKRW(proposal.totalPrice)}</span>
            </div>
          </Card>

          {/* 시술 정보 */}
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

          {/* 상태 */}
          <Card padding="md">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <MetaRow label="상태">
                <StatusBadge statusKey={proposal.status} label={statusLabel} map={PROPOSAL_STATUS_BADGE} />
              </MetaRow>
              <hr style={S.divider} />
              <MetaRow label="발송일">{formatDateKR(proposal.sentAt)}</MetaRow>
              <MetaRow label="열람일">{proposal.viewedAt ? formatDateKR(proposal.viewedAt) : '미열람'}</MetaRow>
              <MetaRow label="크레딧">{proposal.creditsCharged ?? 0}개</MetaRow>
            </div>
          </Card>

          {/* 병원 정보 */}
          <Card padding="md">
            <SectionHeader title="발송 병원" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 12 }}>
              <MetaRow label="병원명">{hospital?.hospitalName || '—'}</MetaRow>
              <MetaRow label="인증">
                {hospital?.verified
                  ? <span style={{ fontSize: 12, color: '#166534', fontWeight: 600 }}>완료</span>
                  : <span style={{ fontSize: 12, color: '#f59e0b', fontWeight: 600 }}>미인증</span>
                }
              </MetaRow>
            </div>
          </Card>

          {/* 고객 / 고민 정보 */}
          {concern && (
            <Card padding="md">
              <SectionHeader title="연결된 고민" />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 12 }}>
                <MetaRow label="고객">{user?.name ?? '—'}</MetaRow>
                <MetaRow label="부위">{concern.primaryArea} {concern.bodyAreaDetail || ''}</MetaRow>
                <MetaRow label="예산">{formatBudget(concern.budgetMin, concern.budgetMax)}</MetaRow>
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

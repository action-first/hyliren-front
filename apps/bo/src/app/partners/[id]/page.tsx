'use client';

import { useEffect, useState, use } from 'react';
import {
  PROPOSAL_STATUS_KR, PROPOSAL_STATUS_BADGE,
  ANESTHESIA_KR, formatDateKR, formatKRW,
} from '@hyliren/shared';
import { Card, Badge, SectionHeader, AdminPage, Spinner } from '@hyliren/ui';
import { BOSidebar } from '@/components/BOSidebar';
import { getPartnerDetail, type AdminPartnerDetail } from '@/lib/api/admin-partners';
import { ApiError } from '@/lib/api/errors';

const S = {
  label: { fontSize: 13, color: 'var(--text-subdued)', marginBottom: 2 } as const,
  value: { fontSize: 14, color: 'var(--text-default)', fontWeight: 500 } as const,
  metaRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' } as const,
  divider: { height: 1, background: 'var(--border-subdued)', margin: 0 } as const,
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

export default function PartnerDetailPage({ params }: Props) {
  const { id } = use(params);
  const [data, setData] = useState<AdminPartnerDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getPartnerDetail(id)
      .then((d) => { if (!cancelled) setData(d); })
      .catch((e: unknown) => {
        if (cancelled) return;
        if (e instanceof ApiError && e.status === 404) {
          setNotFound(true);
          return;
        }
        setError(e instanceof Error ? e.message : '병원 정보를 불러오지 못했습니다.');
      });
    return () => { cancelled = true; };
  }, [id]);

  if (notFound) {
    return (
      <AdminPage sidebar={<BOSidebar active="/partners" />} title="병원 상세" prefix="bo">
        <div style={{ padding: 24, fontSize: 14, color: 'var(--text-subdued)' }}>존재하지 않는 병원입니다.</div>
      </AdminPage>
    );
  }

  if (error) {
    return (
      <AdminPage sidebar={<BOSidebar active="/partners" />} title="병원 상세" prefix="bo">
        <div style={{ padding: 24, color: 'var(--color-danger,#d72c0d)', fontSize: 13 }}>{error}</div>
      </AdminPage>
    );
  }

  if (!data) {
    return (
      <AdminPage sidebar={<BOSidebar active="/partners" />} title="병원 상세" prefix="bo">
        <div style={{ minHeight: 240, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Spinner />
        </div>
      </AdminPage>
    );
  }

  const { member, profile, proposals, stats } = data;

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
      <div className="detail-grid">

        <div className="detail-main">

          <Card padding="md">
            <SectionHeader title="병원 정보" />
            <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px 24px' }}>
              <div>
                <div style={S.label}>병원명</div>
                <div style={S.value}>{profile?.hospitalName || '—'}</div>
              </div>
              <div>
                <div style={S.label}>병원명 (중국어)</div>
                <div style={S.value}>{profile?.hospitalNameZh || '—'}</div>
              </div>
              <div>
                <div style={S.label}>전문 분야</div>
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 2 }}>
                  {profile?.specialties.map(s => <Badge key={s} variant="info">{s}</Badge>)}
                  {(!profile?.specialties || profile.specialties.length === 0) && <span style={S.value}>—</span>}
                </div>
              </div>
              <div>
                <div style={S.label}>전화</div>
                <div style={S.value}>{profile?.phone || '—'}</div>
              </div>
              <div>
                <div style={S.label}>웹사이트</div>
                <div style={S.value}>{profile?.website || '—'}</div>
              </div>
              <div>
                <div style={S.label}>주소</div>
                <div style={S.value}>{profile?.address || '—'}</div>
              </div>
            </div>
          </Card>

          <Card padding="md">
            <SectionHeader title="제안서 내역" subtitle={`${proposals.length}건`} />
            {proposals.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-disabled)', fontSize: 13 }}>제안서가 없습니다</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
                {proposals.map(p => {
                  const pStatus = PROPOSAL_STATUS_KR[p.status] ?? p.status;
                  return (
                    <div key={p.id} style={{
                      padding: '14px 16px', background: 'var(--surface-subdued)', borderRadius: 10,
                      border: '1px solid var(--border-subdued)',
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                        <span style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-default)' }}>{formatKRW(p.totalPrice)}</span>
                        <StatusBadge statusKey={p.status} label={pStatus} map={PROPOSAL_STATUS_BADGE} />
                      </div>
                      <div style={{ display: 'flex', gap: 16, fontSize: 13, color: 'var(--text-subdued)' }}>
                        <span>회복 {p.recoveryDays}일</span>
                        <span>{ANESTHESIA_KR[p.anesthesiaType] ?? p.anesthesiaType}</span>
                        <span>발송 {formatDateKR(p.sentAt)}</span>
                        <span>{p.viewedAt ? `열람 ${formatDateKR(p.viewedAt)}` : '미열람'}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>

        <div className="detail-sticky-sidebar">

          <Card padding="md">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <MetaRow label="발송 제안서">
                <span style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-default)' }}>{stats.proposalCount}건</span>
              </MetaRow>
              <hr style={S.divider} />
              <MetaRow label="열람률">
                <span style={{ fontSize: 16, fontWeight: 700, color: stats.viewRate > 50 ? 'var(--color-success)' : 'var(--color-warning)' }}>{stats.viewRate}%</span>
              </MetaRow>
              <MetaRow label="선택률">
                <span style={{ fontSize: 16, fontWeight: 700, color: stats.selectRate > 30 ? 'var(--color-success)' : 'var(--color-warning)' }}>{stats.selectRate}%</span>
              </MetaRow>
              <MetaRow label="선택 건수">
                <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-default)' }}>{stats.selectedCount}건</span>
              </MetaRow>
            </div>
          </Card>

          <Card padding="md">
            <SectionHeader title="계정 정보" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 12 }}>
              <MetaRow label="이름">{member.name}</MetaRow>
              <MetaRow label="이메일">{member.email || '—'}</MetaRow>
              <hr style={S.divider} />
              <MetaRow label="인증">
                {profile?.verified
                  ? <span style={{ fontSize: 12, color: 'var(--color-success)', fontWeight: 600 }}>완료</span>
                  : <span style={{ fontSize: 12, color: 'var(--color-warning)', fontWeight: 600 }}>미인증</span>
                }
              </MetaRow>
              <MetaRow label="가입일">{formatDateKR(member.createdAt)}</MetaRow>
            </div>
          </Card>
        </div>
      </div>
    </AdminPage>
  );
}

import { notFound } from 'next/navigation';
import {
  MOCK_MEMBERS, MOCK_PARTNER_PROFILES,
  PROPOSAL_STATUS_KR, PROPOSAL_STATUS_BADGE,
  ANESTHESIA_KR, formatDateKR,
} from '@hyliren/shared';
import { getProposals } from '@hyliren/shared/src/server/data-store';
import { Card, Badge, SectionHeader, AdminPage } from '@hyliren/ui';
import { BOSidebar } from '@/components/BOSidebar';

export const dynamic = 'force-dynamic';

// ── 스타일 토큰 ──
const S = {
  label: { fontSize: 13, color: '#94a3b8', marginBottom: 2 } as const,
  value: { fontSize: 14, color: '#0f172a', fontWeight: 500 } as const,
  metaRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' } as const,
  divider: { height: 1, background: '#f1f5f9', margin: 0 } as const,
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
      {/* ══ 2열 레이아웃 ══ */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20, alignItems: 'start' }}>

        {/* ══ 좌측: 메인 콘텐츠 ══ */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* 병원 정보 */}
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

          {/* 제안서 내역 */}
          <Card padding="md">
            <SectionHeader title={`제안서 내역`} subtitle={`${proposals.length}건`} />
            {proposals.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px 0', color: '#94a3b8', fontSize: 13 }}>제안서가 없습니다</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
                {proposals.map(p => {
                  const pStatus = PROPOSAL_STATUS_KR[p.status] ?? p.status;
                  return (
                    <div key={p.id} style={{
                      padding: '14px 16px', background: '#f8fafc', borderRadius: 10,
                      border: '1px solid #f1f5f9',
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                        <span style={{ fontSize: 18, fontWeight: 700, color: '#0f172a' }}>{p.totalPrice}만원</span>
                        <StatusBadge label={pStatus} map={PROPOSAL_STATUS_BADGE} />
                      </div>
                      <div style={{ display: 'flex', gap: 16, fontSize: 13, color: '#64748b' }}>
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

        {/* ══ 우측: 사이드바 ══ */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* KPI 카드 */}
          <Card padding="md">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <MetaRow label="발송 제안서">
                <span style={{ fontSize: 18, fontWeight: 700, color: '#0f172a' }}>{proposals.length}건</span>
              </MetaRow>
              <hr style={S.divider} />
              <MetaRow label="열람률">
                <span style={{ fontSize: 16, fontWeight: 700, color: viewRate > 50 ? '#10b981' : '#f59e0b' }}>{viewRate}%</span>
              </MetaRow>
              <MetaRow label="선택률">
                <span style={{ fontSize: 16, fontWeight: 700, color: selectRate > 30 ? '#10b981' : '#f59e0b' }}>{selectRate}%</span>
              </MetaRow>
              <MetaRow label="선택 건수">
                <span style={{ fontSize: 16, fontWeight: 700, color: '#0f172a' }}>{selectedCount}건</span>
              </MetaRow>
            </div>
          </Card>

          {/* 계정 정보 */}
          <Card padding="md">
            <SectionHeader title="계정 정보" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 12 }}>
              <MetaRow label="이름">{member.name}</MetaRow>
              <MetaRow label="이메일">{member.email || '—'}</MetaRow>
              <hr style={S.divider} />
              <MetaRow label="인증">
                {profile?.verified
                  ? <span style={{ fontSize: 12, color: '#166534', fontWeight: 600 }}>완료</span>
                  : <span style={{ fontSize: 12, color: '#f59e0b', fontWeight: 600 }}>미인증</span>
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

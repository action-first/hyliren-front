import {
  MOCK_USERS,
  MOCK_BUYER_PROFILES,
  MOCK_CONCERNS,
  MOCK_PROPOSALS,
  MOCK_PARTNER_PROFILES,
  CONCERN_STATUS_KR,
  CONCERN_STATUS_BADGE,
  BODY_AREA_BADGE,
  PROPOSAL_STATUS_KR,
  PROPOSAL_STATUS_BADGE,
  formatBudget,
  formatDateKR,
  formatDateRange,
} from '@hyliren/shared';
import { Card, Badge, SectionHeader, AdminPage } from '@hyliren/ui';
import { BOSidebar } from '@/components/BOSidebar';

// ── 스타일 토큰 (Shopreach DS 스타일) ──
const S = {
  label: { fontSize: 13, color: 'var(--text-subdued)', marginBottom: 2 } as const,
  value: { fontSize: 14, color: 'var(--text-default)', fontWeight: 500 } as const,
  sectionGap: { display: 'flex', flexDirection: 'column' as const, gap: 16 },
  metaRow: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  } as const,
  divider: {
    height: 1, background: 'var(--border-subdued)', margin: 0,
  } as const,
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
      display: 'inline-flex', alignItems: 'center',
      padding: '2px 8px', borderRadius: 4,
      fontSize: 12, fontWeight: 500,
      backgroundColor: c.bg, color: c.text,
    }}>
      {label}
    </span>
  );
}

interface Props { params: Promise<{ id: string }>; }

export default async function BuyerDetailPage({ params }: Props) {
  const { id } = await params;
  const user = MOCK_USERS.find(u => u.id === id) || MOCK_USERS[0];
  const profile = MOCK_BUYER_PROFILES.find(p => p.userId === user.id);

  const concerns = MOCK_CONCERNS.filter(c => c.userId === user.id && !c.deletedAt)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const proposals = MOCK_PROPOSALS.filter(p =>
    concerns.some(c => c.id === p.concernId) && p.isActive
  ).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  // 활동 타임라인
  const events = concerns.flatMap(c => {
    const items: { time: string; text: string; type: 'concern' | 'proposal' | 'action' }[] = [
      { time: c.createdAt, text: `고민 등록: ${c.bodyArea} ${c.bodyAreaDetail || ''}`, type: 'concern' },
    ];
    const ps = MOCK_PROPOSALS.filter(p => p.concernId === c.id && p.isActive);
    ps.forEach(p => {
      if (p.sentAt) items.push({ time: p.sentAt, text: `제안서 도착 (${p.totalPrice}만원)`, type: 'proposal' });
      if (p.viewedAt) items.push({ time: p.viewedAt, text: '제안서 열람', type: 'action' });
      if (p.status === 'shortlisted') items.push({ time: p.viewedAt || p.sentAt || c.createdAt, text: '제안서 비교 선택', type: 'action' });
      if (p.status === 'selected') items.push({ time: p.updatedAt, text: '병원 선택 완료', type: 'action' });
    });
    return items;
  }).sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

  // 통계
  const totalProposals = proposals.length;
  const viewedProposals = proposals.filter(p => p.viewedAt).length;
  const selectedProposals = proposals.filter(p => p.status === 'selected').length;

  const genderLabel = profile?.gender === 'female' ? '여성' : profile?.gender === 'male' ? '남성' : profile?.gender === 'other' ? '기타' : '-';
  const age = profile?.birthYear ? new Date().getFullYear() - profile.birthYear : null;

  return (
    <AdminPage sidebar={<BOSidebar active="/buyers" />} title={`고객 상세 — ${user.name}`} prefix="bo">

      {/* ══════ 2열 레이아웃 (Shopreach claim-process-grid 스타일) ══════ */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20, alignItems: 'start' }}>

        {/* ══════ 좌측: 메인 콘텐츠 ══════ */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* ── 고민 내역 ── */}
          <Card padding="md">
            <SectionHeader
              title={`고민 내역`}
              subtitle={`총 ${concerns.length}건의 상담 고민이 등록되어 있습니다`}
            />
            <div style={{ marginTop: 16 }}>
              {concerns.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-disabled)', fontSize: 14 }}>
                  등록된 고민이 없습니다
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {concerns.map(c => {
                    const statusLabel = CONCERN_STATUS_KR[c.status] ?? c.status;
                    const areaColor = BODY_AREA_BADGE[c.bodyArea];
                    return (
                      <div
                        key={c.id}
                        style={{
                          padding: '12px 16px',
                          background: 'var(--surface-subdued)',
                          borderRadius: 'var(--app-radius-sm)',
                          border: '1px solid var(--border-subdued)',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            {areaColor && (
                              <span style={{
                                display: 'inline-flex', alignItems: 'center',
                                padding: '2px 8px', borderRadius: 4,
                                fontSize: 12, fontWeight: 500,
                                backgroundColor: areaColor.bg, color: areaColor.text,
                              }}>
                                {c.bodyArea}
                              </span>
                            )}
                            <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-default)' }}>
                              {c.bodyAreaDetail || c.bodyArea}
                            </span>
                          </div>
                          <StatusBadge label={statusLabel} map={CONCERN_STATUS_BADGE} />
                        </div>
                        <div style={{ display: 'flex', gap: 16, fontSize: 13, color: 'var(--text-subdued)' }}>
                          <span>예산: {formatBudget(c.budgetMin, c.budgetMax)}</span>
                          <span>방문: {formatDateRange(c.visitDateFrom, c.visitDateTo)}</span>
                          <span>등록: {formatDateKR(c.createdAt)}</span>
                        </div>
                        {c.description && (
                          <p style={{ margin: '8px 0 0', fontSize: 13, color: 'var(--text-subdued)', lineHeight: 1.5 }}>
                            {c.description}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </Card>

          {/* ── 제안서 현황 ── */}
          <Card padding="md">
            <SectionHeader
              title="제안서 현황"
              subtitle={`${totalProposals}건의 제안서가 접수되었습니다`}
            />
            <div style={{ marginTop: 16 }}>
              {proposals.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-disabled)', fontSize: 14 }}>
                  접수된 제안서가 없습니다
                </div>
              ) : (
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>고민 부위</th>
                      <th>병원</th>
                      <th>금액</th>
                      <th>상태</th>
                      <th>발송일</th>
                    </tr>
                  </thead>
                  <tbody>
                    {proposals.map(p => {
                      const concern = concerns.find(c => c.id === p.concernId);
                      const statusLabel = PROPOSAL_STATUS_KR[p.status] ?? p.status;
                      return (
                        <tr key={p.id}>
                          <td>
                            <span style={{ fontSize: 13, color: 'var(--text-default)' }}>
                              {concern?.bodyArea || '-'} {concern?.bodyAreaDetail || ''}
                            </span>
                          </td>
                          <td style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-default)' }}>
                            {MOCK_PARTNER_PROFILES.find(pp => pp.memberId === p.memberId)?.hospitalName || '-'}
                          </td>
                          <td style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-default)', fontVariantNumeric: 'tabular-nums' }}>
                            {p.totalPrice}만원
                          </td>
                          <td>
                            <StatusBadge label={statusLabel} map={PROPOSAL_STATUS_BADGE} />
                          </td>
                          <td style={{ fontSize: 13, color: 'var(--text-subdued)', fontVariantNumeric: 'tabular-nums' }}>
                            {formatDateKR(p.sentAt)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </Card>

          {/* ── 활동 타임라인 ── */}
          <Card padding="md">
            <SectionHeader
              title="활동 타임라인"
              subtitle="최근 활동 기록입니다"
            />
            <div className="timeline" style={{ marginTop: 16 }}>
              {events.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-disabled)', fontSize: 14 }}>
                  활동 기록이 없습니다
                </div>
              ) : (
                events.slice(0, 15).map((ev, i) => (
                  <div key={i} className="timeline-item">
                    <span className="timeline-time">{formatDateKR(ev.time)}</span>
                    <span className="timeline-text">{ev.text}</span>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>

        {/* ══════ 우측: Sticky 사이드바 ══════ */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, position: 'sticky', top: 20, alignSelf: 'flex-start' }}>

          {/* ── 고객 정보 ── */}
          <Card padding="md">
            <SectionHeader title="고객 정보" />
            <div style={{ ...S.sectionGap, marginTop: 16 }}>
              {/* 이름 강조 */}
              <div>
                <div style={S.label}>이름</div>
                <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-default)' }}>{user.name}</div>
              </div>

              <div style={S.divider} />

              <MetaRow label="연락처">{user.phone || user.email || '-'}</MetaRow>
              <MetaRow label="이메일">{user.email || '-'}</MetaRow>
              <MetaRow label="국가/도시">{profile?.country || '-'} {profile?.city || ''}</MetaRow>
              <MetaRow label="성별">{genderLabel}</MetaRow>
              {age && <MetaRow label="나이">{age}세 ({profile?.birthYear}년생)</MetaRow>}
              <MetaRow label="언어"><Badge>{user.locale}</Badge></MetaRow>

              <div style={S.divider} />

              <MetaRow label="가입일">{formatDateKR(user.createdAt)}</MetaRow>
              {user.referredBy && (
                <MetaRow label="추천인">
                  <span style={{ fontSize: 13, color: 'var(--interactive-default)', fontWeight: 500 }}>
                    {MOCK_USERS.find(u => u.id === user.referredBy)?.name || user.referredBy}
                  </span>
                </MetaRow>
              )}
              {user.referralCode && <MetaRow label="추천 코드">{user.referralCode}</MetaRow>}
            </div>
          </Card>

          {/* ── 활동 요약 ── */}
          <Card padding="md">
            <SectionHeader title="활동 요약" />
            <div style={{ ...S.sectionGap, marginTop: 16 }}>
              <MetaRow label="고민 등록">{concerns.length}건</MetaRow>
              <MetaRow label="받은 제안서">{totalProposals}건</MetaRow>
              <MetaRow label="열람한 제안서">{viewedProposals}건</MetaRow>
              <MetaRow label="선택 완료">{selectedProposals}건</MetaRow>

              <div style={S.divider} />

              {/* 전환 퍼널 요약 */}
              <div>
                <div style={{ fontSize: 12, color: 'var(--text-disabled)', marginBottom: 8 }}>전환 퍼널</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {[
                    { label: '고민 → 제안', value: concerns.length > 0 ? `${Math.round((totalProposals / concerns.length) * 100)}%` : '-' },
                    { label: '제안 → 열람', value: totalProposals > 0 ? `${Math.round((viewedProposals / totalProposals) * 100)}%` : '-' },
                    { label: '열람 → 선택', value: viewedProposals > 0 ? `${Math.round((selectedProposals / viewedProposals) * 100)}%` : '-' },
                  ].map((row, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 12, color: 'var(--text-subdued)' }}>{row.label}</span>
                      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--interactive-default)', fontVariantNumeric: 'tabular-nums' }}>{row.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </AdminPage>
  );
}

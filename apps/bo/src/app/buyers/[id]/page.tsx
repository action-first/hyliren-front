'use client';

import { useEffect, useState, use } from 'react';
import {
  CONCERN_STATUS_KR,
  CONCERN_STATUS_BADGE,
  BODY_AREA_BADGE,
  PROPOSAL_STATUS_KR,
  PROPOSAL_STATUS_BADGE,
  formatBudget,
  formatDateKR,
  formatDateRange,
  formatKRW,
} from '@hyliren/shared';
import { Card, Badge, SectionHeader, AdminPage, Spinner } from '@hyliren/ui';
import { BOSidebar } from '@/components/BOSidebar';
import {
  getBuyerDetail,
  type AdminBuyerDetail,
  type AdminBuyerConcern,
  type AdminBuyerProposal,
} from '@/lib/api/admin-buyers';
import { ApiError } from '@/lib/api/errors';

const S = {
  label: { fontSize: 13, color: 'var(--text-subdued)', marginBottom: 2 } as const,
  value: { fontSize: 14, color: 'var(--text-default)', fontWeight: 500 } as const,
  sectionGap: { display: 'flex', flexDirection: 'column' as const, gap: 16 },
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
      display: 'inline-flex', alignItems: 'center',
      padding: '2px 8px', borderRadius: 4,
      fontSize: 12, fontWeight: 500,
      backgroundColor: c.bg, color: c.text,
    }}>
      {label}
    </span>
  );
}

interface TimelineEvent {
  time: string;
  text: string;
  type: 'concern' | 'proposal' | 'action';
}

function buildTimeline(concerns: AdminBuyerConcern[], proposals: AdminBuyerProposal[]): TimelineEvent[] {
  const items: TimelineEvent[] = [];
  for (const c of concerns) {
    items.push({
      time: c.createdAt,
      text: `고민 등록: ${c.primaryArea} ${c.bodyAreaDetail || ''}`,
      type: 'concern',
    });
    const ps = proposals.filter((p) => p.concernId === c.id);
    for (const p of ps) {
      if (p.sentAt) items.push({ time: p.sentAt, text: `제안서 도착 (${formatKRW(p.totalPrice)})`, type: 'proposal' });
      if (p.viewedAt) items.push({ time: p.viewedAt, text: '제안서 열람', type: 'action' });
      if (p.status === 'accepted') items.push({ time: p.updatedAt, text: '병원 선택 완료', type: 'action' });
    }
  }
  return items.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
}

interface Props { params: Promise<{ id: string }> }

export default function BuyerDetailPage({ params }: Props) {
  const { id } = use(params);
  const [data, setData] = useState<AdminBuyerDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getBuyerDetail(id)
      .then((d) => { if (!cancelled) setData(d); })
      .catch((e: unknown) => {
        if (cancelled) return;
        if (e instanceof ApiError && e.status === 404) {
          setNotFound(true);
          return;
        }
        setError(e instanceof Error ? e.message : '고객 정보를 불러오지 못했습니다.');
      });
    return () => { cancelled = true; };
  }, [id]);

  if (notFound) {
    return (
      <AdminPage sidebar={<BOSidebar active="/buyers" />} title="고객 상세" prefix="bo">
        <div style={{ padding: 24, fontSize: 14, color: '#475569' }}>존재하지 않는 고객입니다.</div>
      </AdminPage>
    );
  }
  if (error) {
    return (
      <AdminPage sidebar={<BOSidebar active="/buyers" />} title="고객 상세" prefix="bo">
        <div style={{ padding: 24, color: 'var(--color-danger,#d72c0d)', fontSize: 13 }}>{error}</div>
      </AdminPage>
    );
  }
  if (!data) {
    return (
      <AdminPage sidebar={<BOSidebar active="/buyers" />} title="고객 상세" prefix="bo">
        <div style={{ minHeight: 240, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Spinner />
        </div>
      </AdminPage>
    );
  }

  const { user, profile, concerns, proposals, stats } = data;
  const events = buildTimeline(concerns, proposals);
  const genderLabel = profile?.gender === 'female' ? '여성' : profile?.gender === 'male' ? '남성' : profile?.gender === 'other' ? '기타' : '-';
  const age = profile?.birthYear ? new Date().getFullYear() - profile.birthYear : null;

  return (
    <AdminPage sidebar={<BOSidebar active="/buyers" />} title={`고객 상세 — ${user.name}`} prefix="bo">

      <div className="detail-grid">

        <div className="detail-main">

          {/* 고민 내역 */}
          <Card padding="md">
            <SectionHeader
              title="고민 내역"
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
                    const areaColor = BODY_AREA_BADGE[c.primaryArea];
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
                                {c.primaryArea}
                              </span>
                            )}
                            <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-default)' }}>
                              {c.bodyAreaDetail || c.primaryArea}
                            </span>
                          </div>
                          <StatusBadge statusKey={c.status} label={statusLabel} map={CONCERN_STATUS_BADGE} />
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

          {/* 제안서 현황 */}
          <Card padding="md">
            <SectionHeader title="제안서 현황" subtitle={`${stats.proposalCount}건의 제안서가 접수되었습니다`} />
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
                              {concern?.primaryArea || '-'} {concern?.bodyAreaDetail || ''}
                            </span>
                          </td>
                          <td style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-default)' }}>
                            {p.hospitalName || '-'}
                          </td>
                          <td style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-default)', fontVariantNumeric: 'tabular-nums' }}>
                            {formatKRW(p.totalPrice)}
                          </td>
                          <td>
                            <StatusBadge statusKey={p.status} label={statusLabel} map={PROPOSAL_STATUS_BADGE} />
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

          {/* 활동 타임라인 */}
          <Card padding="md">
            <SectionHeader title="활동 타임라인" subtitle="최근 활동 기록입니다" />
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

        {/* 우측 사이드바 */}
        <div className="detail-sticky-sidebar">

          <Card padding="md">
            <SectionHeader title="고객 정보" />
            <div style={{ ...S.sectionGap, marginTop: 16 }}>
              <div>
                <div style={S.label}>이름</div>
                <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-default)' }}>{user.name}</div>
              </div>

              <div style={S.divider} />

              <MetaRow label="연락처">{user.phone || user.email || '-'}</MetaRow>
              <MetaRow label="이메일">{user.email || '-'}</MetaRow>
              <MetaRow label="국가/도시">{profile?.country || '-'} {profile?.city || ''}</MetaRow>
              <MetaRow label="성별">{genderLabel}</MetaRow>
              {age !== null && <MetaRow label="나이">{age}세 ({profile?.birthYear}년생)</MetaRow>}
              <MetaRow label="언어"><Badge>{user.locale}</Badge></MetaRow>

              <div style={S.divider} />

              <MetaRow label="가입일">{formatDateKR(user.createdAt)}</MetaRow>
              {user.referredByName && (
                <MetaRow label="추천인">
                  <span style={{ fontSize: 13, color: 'var(--interactive-default)', fontWeight: 500 }}>
                    {user.referredByName}
                  </span>
                </MetaRow>
              )}
              {user.referralCode && <MetaRow label="추천 코드">{user.referralCode}</MetaRow>}
            </div>
          </Card>

          <Card padding="md">
            <SectionHeader title="활동 요약" />
            <div style={{ ...S.sectionGap, marginTop: 16 }}>
              <MetaRow label="고민 등록">{stats.concernCount}건</MetaRow>
              <MetaRow label="받은 제안서">{stats.proposalCount}건</MetaRow>
              <MetaRow label="열람한 제안서">{stats.viewedCount}건</MetaRow>
              <MetaRow label="선택 완료">{stats.selectedCount}건</MetaRow>

              <div style={S.divider} />

              <div>
                <div style={{ fontSize: 12, color: 'var(--text-disabled)', marginBottom: 8 }}>전환 퍼널</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {[
                    { label: '고민 → 제안', value: stats.concernCount > 0 ? `${Math.round((stats.proposalCount / stats.concernCount) * 100)}%` : '-' },
                    { label: '제안 → 열람', value: stats.proposalCount > 0 ? `${Math.round((stats.viewedCount / stats.proposalCount) * 100)}%` : '-' },
                    { label: '열람 → 선택', value: stats.viewedCount > 0 ? `${Math.round((stats.selectedCount / stats.viewedCount) * 100)}%` : '-' },
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

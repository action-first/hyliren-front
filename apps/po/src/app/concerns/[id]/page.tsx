'use client';

import { useEffect, useState } from 'react';
import { notFound, useParams } from 'next/navigation';
import {
  CONCERN_STATUS_KR, CONCERN_STATUS_BADGE, BODY_AREA_BADGE,
  formatBudget, formatDateRange, formatDateKR,
} from '@hyliren/shared';
import { Card, Badge, Button, SectionHeader, AdminPage, Spinner } from '@hyliren/ui';
import { POSidebar } from '@/components/POSidebar';
import { getConcern, type ConcernDetailWire } from '@/lib/api/concern';
import { findMyProposalByConcern, formatKrwAsMan, type ProposalDetailWire } from '@/lib/api/proposal';
import { ApiError } from '@/lib/api/errors';
import Link from 'next/link';

// ── 스타일 토큰 ──
const S = {
  label: { fontSize: 13, color: '#94a3b8', marginBottom: 2 } as const,
  value: { fontSize: 14, color: '#0f172a', fontWeight: 500 } as const,
  metaRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' } as const,
  divider: {
    height: 1,
    border: 0,
    margin: 0,
    background: 'color-mix(in srgb, var(--border-subdued) 88%, transparent)',
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
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 500,
      backgroundColor: c.bg, color: c.text,
    }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: c.text, opacity: 0.5 }} />
      {label}
    </span>
  );
}

// ── 소스 라벨 ──
const SOURCE_KR: Record<string, string> = {
  organic: '직접 유입', referral: '추천', article: '아티클', ad: '광고', direct: '다이렉트',
};

export default function ConcernDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [concern, setConcern] = useState<ConcernDetailWire | null>(null);
  const [myProposal, setMyProposal] = useState<ProposalDetailWire | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFoundError, setNotFoundError] = useState(false);

  useEffect(() => {
    if (!id) return;
    Promise.all([
      getConcern(id),
      findMyProposalByConcern(id).catch(() => null),
    ])
      .then(([data, proposal]) => {
        setConcern(data);
        setMyProposal(proposal);
        setLoading(false);
      })
      .catch((err) => {
        if (err instanceof ApiError && err.status === 404) {
          setNotFoundError(true);
        }
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return (
      <AdminPage sidebar={<POSidebar active="/concerns" />} title="고민 상세" prefix="po">
        <div className="flex items-center justify-center py-20"><Spinner /></div>
      </AdminPage>
    );
  }

  if (notFoundError || !concern) {
    notFound();
  }

  const statusLabel = CONCERN_STATUS_KR[concern.status] ?? concern.status;

  return (
    <AdminPage
      sidebar={<POSidebar active="/concerns" />}
      title="고민 상세"
      prefix="po"
      actions={
        myProposal ? (
          <Link href={`/proposals/${myProposal.id}`}>
            <Button variant="secondary" size="sm">내 제안서 보기</Button>
          </Link>
        ) : (
          <Link href={`/concerns/${concern.id}/propose`}>
            <Button variant="accent" size="sm">제안서 작성</Button>
          </Link>
        )
      }
    >
      {/* ══ 2열 레이아웃 ══ */}
      <div className="detail-grid">

        {/* ══ 좌측: 메인 콘텐츠 ══ */}
        <div className="detail-main">

          {/* 고민 내용 */}
          <Card padding="md">
            <SectionHeader title="고민 내용" />
            <p style={{ fontSize: 14, color: '#374151', lineHeight: 1.7, margin: '12px 0 0' }}>
              {concern.description}
            </p>
          </Card>

          {/* 고민 상세 정보 */}
          <Card padding="md">
            <SectionHeader title="상세 정보" />
            <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px 24px' }}>
              <div>
                <div style={S.label}>부위</div>
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 4 }}>
                  {concern.bodyAreas.map(area => {
                    const c = BODY_AREA_BADGE[area];
                    return c ? (
                      <span key={area} style={{ padding: '2px 8px', borderRadius: 4, fontSize: 12, fontWeight: 500, background: c.bg, color: c.text }}>{area}</span>
                    ) : <Badge key={area}>{area}</Badge>;
                  })}
                </div>
              </div>
              <div>
                <div style={S.label}>상세</div>
                <div style={S.value}>{concern.bodyAreaDetail || '-'}</div>
              </div>
              <div>
                <div style={S.label}>예산</div>
                <div style={{ ...S.value, fontVariantNumeric: 'tabular-nums' }}>{formatBudget(concern.budgetMin, concern.budgetMax)}</div>
              </div>
              <div>
                <div style={S.label}>방문 시기</div>
                <div style={S.value}>{formatDateRange(concern.visitDateFrom, concern.visitDateTo)}</div>
              </div>
              <div>
                <div style={S.label}>유입 경로</div>
                <div style={S.value}>{SOURCE_KR[concern.source] || concern.source}</div>
              </div>
            </div>
          </Card>

          {/* 사진 */}
          {concern.photos.length > 0 && (
            <Card padding="md">
              <SectionHeader title={`첨부 사진 (${concern.photos.length}장)`} />
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginTop: 12 }}>
                {concern.photos.map(p => (
                  <div key={p.id} style={{
                    aspectRatio: '1', background: '#f8fafc', borderRadius: 8,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    border: '1px solid #f1f5f9', color: '#cbd5e1', fontSize: 13,
                    overflow: 'hidden',
                  }}>
                    {p.url ? <img src={p.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : '사진'}
                  </div>
                ))}
              </div>
            </Card>
          )}

          <Card padding="md">
            <SectionHeader title="내 제안서" />
            {myProposal ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, marginTop: 12 }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>
                    {formatKrwAsMan(myProposal.totalPrice)} · 회복 {myProposal.recoveryDays}일
                  </div>
                  <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>
                    {myProposal.items.map(item => item.treatmentName).join(', ')}
                  </div>
                </div>
                <Link href={`/proposals/${myProposal.id}`}>
                  <Button variant="secondary" size="sm">상세 보기</Button>
                </Link>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '32px 0' }}>
                <p style={{ fontSize: 14, color: '#94a3b8', marginBottom: 12 }}>아직 제안서를 발송하지 않았습니다</p>
                <Link href={`/concerns/${concern.id}/propose`}>
                  <Button variant="accent" size="sm">제안서 작성하기</Button>
                </Link>
              </div>
            )}
          </Card>
        </div>

        {/* ══ 우측: 사이드바 ══ */}
        <div className="detail-sticky-sidebar">

          {/* 상태 카드 */}
          <Card padding="md">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <MetaRow label="상태">
                <StatusBadge label={statusLabel} map={CONCERN_STATUS_BADGE} />
              </MetaRow>
              <hr style={S.divider} />
              <MetaRow label="등록일">{formatDateKR(concern.createdAt)}</MetaRow>
              <MetaRow label="수정일">{formatDateKR(concern.updatedAt)}</MetaRow>
              <hr style={S.divider} />
              <MetaRow label="접수 제안서">{concern.proposalCount}건</MetaRow>
            </div>
          </Card>

          {/* 고객 정보 / 다른 고민은 partner 미노출 정책상 제거.
              필요 시 backend 에 별도 마스킹된 endpoint 추가 후 복구 (백로그). */}
        </div>
      </div>
    </AdminPage>
  );
}

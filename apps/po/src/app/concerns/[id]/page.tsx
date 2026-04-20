import { notFound } from 'next/navigation';
import {
  MOCK_USERS, MOCK_BUYER_PROFILES, MOCK_PARTNER_PROFILES,
  CONCERN_STATUS_KR, CONCERN_STATUS_BADGE, BODY_AREA_BADGE,
  ANESTHESIA_KR, PROPOSAL_STATUS_KR, PROPOSAL_STATUS_BADGE,
  formatBudget, formatDateRange, formatDateKR,
} from '@hyliren/shared';
import { getConcerns, getConcernPhotos, getProposals } from '@hyliren/shared/src/server/data-store';
import { Card, Badge, Button, SectionHeader, AdminPage } from '@hyliren/ui';
import { POSidebar } from '@/components/POSidebar';
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

interface Props { params: Promise<{ id: string }> }

export default async function ConcernDetailPage({ params }: Props) {
  const { id } = await params;
  const concern = getConcerns().find(c => c.id === id);
  if (!concern) notFound();

  const photos = getConcernPhotos().filter(p => p.concernId === concern.id);
  const allProposals = getProposals().filter(p => p.concernId === concern.id && p.isActive);

  // PO에서는 현재 파트너의 제안서만 표시 (MVP: m-001 하드코딩)
  const currentMemberId = 'm-001';
  const myProposals = allProposals.filter(p => p.memberId === currentMemberId);
  const otherProposalCount = allProposals.length - myProposals.length;

  // 고객 정보
  const user = MOCK_USERS.find(u => u.id === concern.userId);
  const buyerProfile = MOCK_BUYER_PROFILES.find(p => p.userId === concern.userId);
  const statusLabel = CONCERN_STATUS_KR[concern.status] ?? concern.status;

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
      {/* ══ 2열 레이아웃 ══ */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20, alignItems: 'start' }}>

        {/* ══ 좌측: 메인 콘텐츠 ══ */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

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
                <div style={S.label}>여권</div>
                <div style={S.value}>{concern.hasPassport ? '보유' : '미보유'}</div>
              </div>
              <div>
                <div style={S.label}>유입 경로</div>
                <div style={S.value}>{SOURCE_KR[concern.source] || concern.source}</div>
              </div>
            </div>
          </Card>

          {/* 사진 */}
          {photos.length > 0 && (
            <Card padding="md">
              <SectionHeader title={`첨부 사진 (${photos.length}장)`} />
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginTop: 12 }}>
                {photos.map(p => (
                  <div key={p.id} style={{
                    aspectRatio: '1', background: '#f8fafc', borderRadius: 8,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    border: '1px solid #f1f5f9', color: '#cbd5e1', fontSize: 13,
                  }}>사진</div>
                ))}
              </div>
            </Card>
          )}

          {/* 내 제안서 */}
          <Card padding="md">
            <SectionHeader
              title="내 제안서"
              subtitle={myProposals.length > 0 ? `${myProposals.length}건 발송됨` : undefined}
            />
            {myProposals.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px 0' }}>
                <p style={{ fontSize: 14, color: '#94a3b8', marginBottom: 12 }}>아직 제안서를 발송하지 않았습니다</p>
                <Link href={`/concerns/${concern.id}/propose`}>
                  <Button variant="accent" size="sm">제안서 작성하기</Button>
                </Link>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 12 }}>
                {myProposals.map(p => {
                  const pStatusLabel = PROPOSAL_STATUS_KR[p.status] ?? p.status;
                  return (
                    <div key={p.id} style={{
                      padding: '14px 16px', background: '#f8fafc', borderRadius: 10,
                      border: '1px solid #f1f5f9',
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                        <span style={{ fontSize: 18, fontWeight: 700, color: '#0f172a' }}>{p.totalPrice}만원</span>
                        <StatusBadge label={pStatusLabel} map={PROPOSAL_STATUS_BADGE} />
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
              <MetaRow label="접수 제안서">{allProposals.length}건</MetaRow>
              {otherProposalCount > 0 && (
                <MetaRow label="타 병원 제안">
                  <span style={{ fontSize: 13, color: '#94a3b8' }}>{otherProposalCount}건</span>
                </MetaRow>
              )}
            </div>
          </Card>

          {/* 고객 정보 카드 */}
          <Card padding="md">
            <SectionHeader title="고객 정보" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 12 }}>
              <MetaRow label="이름">{user?.name ?? '-'}</MetaRow>
              <hr style={S.divider} />
              <MetaRow label="국적">{buyerProfile?.country ?? '-'}</MetaRow>
              <MetaRow label="언어">{user?.locale === 'zh-CN' ? '中文' : user?.locale ?? '-'}</MetaRow>
              {buyerProfile?.birthYear && (
                <MetaRow label="나이대">{new Date().getFullYear() - buyerProfile.birthYear}세</MetaRow>
              )}
              {buyerProfile?.gender && (
                <MetaRow label="성별">
                  {buyerProfile.gender === 'female' ? '여성' : buyerProfile.gender === 'male' ? '남성' : '기타'}
                </MetaRow>
              )}
            </div>
          </Card>

          {/* 고민 이력 */}
          <Card padding="md">
            <SectionHeader title="이 고객의 다른 고민" />
            {(() => {
              const otherConcerns = getConcerns().filter(c => c.userId === concern.userId && c.id !== concern.id && !c.deletedAt);
              if (otherConcerns.length === 0) return (
                <p style={{ fontSize: 13, color: '#94a3b8', marginTop: 12 }}>다른 고민이 없습니다</p>
              );
              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
                  {otherConcerns.map(c => {
                    const cStatus = CONCERN_STATUS_KR[c.status] ?? c.status;
                    return (
                      <Link key={c.id} href={`/concerns/${c.id}`} style={{ textDecoration: 'none' }}>
                        <div style={{
                          padding: '10px 12px', background: '#f8fafc', borderRadius: 8,
                          border: '1px solid #f1f5f9', transition: 'background 150ms', cursor: 'pointer',
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: 13, fontWeight: 500, color: '#334155' }}>{c.primaryArea} {c.bodyAreaDetail || ''}</span>
                            <span style={{ fontSize: 11, color: '#94a3b8' }}>{cStatus}</span>
                          </div>
                          <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>{formatDateKR(c.createdAt)}</div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              );
            })()}
          </Card>
        </div>
      </div>
    </AdminPage>
  );
}

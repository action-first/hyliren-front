import { MOCK_USERS, MOCK_BUYER_PROFILES, MOCK_CONCERNS, MOCK_PROPOSALS } from '@hyliren/shared';
import { Card, Badge, SectionHeader } from '@hyliren/ui';
import { BOSidebar } from '@/components/BOSidebar';

interface Props { params: Promise<{ id: string }>; }

export default async function BuyerDetailPage({ params }: Props) {
  const { id } = await params;
  const user = MOCK_USERS.find(u => u.id === id) || MOCK_USERS[0];
  const profile = MOCK_BUYER_PROFILES.find(p => p.userId === user.id);
  const concerns = MOCK_CONCERNS.filter(c => c.userId === user.id && !c.deletedAt)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  // Build timeline events
  const events = concerns.flatMap(c => {
    const items: { time: string; text: string }[] = [
      { time: c.createdAt, text: `고민 등록: ${c.bodyArea} ${c.bodyAreaDetail || ''}` },
    ];
    const proposals = MOCK_PROPOSALS.filter(p => p.concernId === c.id && p.isActive);
    proposals.forEach(p => {
      if (p.sentAt) items.push({ time: p.sentAt, text: `제안서 도착 (${p.totalPrice}만원)` });
      if (p.viewedAt) items.push({ time: p.viewedAt, text: '제안서 열람' });
      if (p.status === 'shortlisted') items.push({ time: p.viewedAt || p.sentAt || c.createdAt, text: '제안서 비교 선택' });
      if (p.status === 'selected') items.push({ time: p.updatedAt, text: '병원 선택 완료' });
    });
    return items;
  }).sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

  return (
    <div className="bo-layout">
      <BOSidebar active="/buyers" />
      <div className="bo-main">
        <div className="bo-topbar">
          <span className="bo-topbar-title">고객 상세 — {user.name}</span>
        </div>
        <div className="bo-content">
          {/* Profile */}
          <Card padding="md" style={{ marginBottom: 'var(--space-6)' }}>
            <SectionHeader title="프로필" />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--space-4)', marginTop: 'var(--space-4)' }}>
              <div>
                <div style={{ fontSize: 'var(--admin-text-small)', color: 'var(--admin-text-secondary)' }}>연락처</div>
                <div>{user.phone || user.email || '-'}</div>
              </div>
              <div>
                <div style={{ fontSize: 'var(--admin-text-small)', color: 'var(--admin-text-secondary)' }}>국가/도시</div>
                <div>{profile?.country || '-'} {profile?.city || ''}</div>
              </div>
              <div>
                <div style={{ fontSize: 'var(--admin-text-small)', color: 'var(--admin-text-secondary)' }}>언어</div>
                <Badge>{user.locale}</Badge>
              </div>
            </div>
          </Card>

          {/* Concerns */}
          <Card padding="md" style={{ marginBottom: 'var(--space-6)' }}>
            <SectionHeader title={`고민 ${concerns.length}건`} />
            <table className="data-table" style={{ marginTop: 'var(--space-4)' }}>
              <thead>
                <tr><th>부위</th><th>예산</th><th>상태</th><th>등록일</th></tr>
              </thead>
              <tbody>
                {concerns.map(c => (
                  <tr key={c.id}>
                    <td><Badge variant="info">{c.bodyArea}</Badge> {c.bodyAreaDetail || ''}</td>
                    <td>{c.budgetMin}~{c.budgetMax}만</td>
                    <td><Badge>{c.status}</Badge></td>
                    <td>{new Date(c.createdAt).toLocaleDateString('ko')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>

          {/* Timeline */}
          <Card padding="md">
            <SectionHeader title="활동 타임라인" />
            <div className="timeline" style={{ marginTop: 'var(--space-4)' }}>
              {events.slice(0, 10).map((ev, i) => (
                <div key={i} className="timeline-item">
                  <span className="timeline-time">{new Date(ev.time).toLocaleDateString('ko')}</span>
                  <span className="timeline-text">{ev.text}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

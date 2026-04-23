import Link from 'next/link';
import { MOCK_MEMBERS, MOCK_USERS, isProposalAccepted } from '@hyliren/shared';
import { getConcerns, getProposals, getEvents, getPayments } from '@hyliren/shared/src/server/data-store';
import { Badge, Button, AdminPage } from '@hyliren/ui';
import { BOSidebar } from '@/components/BOSidebar';
import { ConcernStatusPie, ProposalStatusBar, ConversionFunnel, BodyAreaTreemap } from '@/components/DashboardCharts';
import { BODashboardKPI } from '@/components/BODashboardKPI';
import { DashboardHeader } from '@/components/DashboardHeader';

export const dynamic = 'force-dynamic';

const STATUS_LABELS: Record<string, string> = {
  submitted: '등록', proposal_received: '제안 도착', comparing: '비교 중',
  hospital_selected: '병원 선택', completed: '완료',
};

// ── 이벤트 한글 라벨 + 시맨틱 컬러 뱃지 ──
const EVENT_KR: Record<string, string> = {
  concern_submit: '고민 등록',
  proposal_send: '제안서 발송',
  proposal_view: '제안서 열람',
  page_view: '페이지 조회',
  report_purchase: '리포트 구매',
};
const EVENT_STYLE: Record<string, { bg: string; text: string }> = {
  concern_submit: { bg: '#EEF2FF', text: '#4F46E5' },
  proposal_send: { bg: '#F5F3FF', text: '#8B5CF6' },
  proposal_view: { bg: '#ECFDF5', text: '#10B981' },
  page_view: { bg: '#F8FAFC', text: '#64748B' },
  report_purchase: { bg: '#FFF1F2', text: '#F43F5E' },
};

const PROPOSAL_STATUS_LABELS: Record<string, string> = {
  sent: '발송', viewed: '열람', shortlisted: '후보', selected: '선택', rejected: '거절',
};

export default function DashboardPage() {
  const buyers = MOCK_USERS.filter(u => u.role === 'buyer');
  const partners = MOCK_MEMBERS.filter(m => m.role === 'partner');
  const concerns = getConcerns().filter(c => !c.deletedAt);
  const proposals = getProposals().filter(p => p.isActive);
  const events = getEvents();
  const payments = getPayments();

  const totalRevenue = payments.filter(p => p.status === 'paid').reduce((sum, p) => sum + p.amount, 0);
  const viewedCount = proposals.filter(p => p.viewedAt).length;
  const selectedCount = proposals.filter(isProposalAccepted).length;
  const viewRate = proposals.length > 0 ? Math.round((viewedCount / proposals.length) * 100) : 0;
  const selectRate = proposals.length > 0 ? Math.round((selectedCount / proposals.length) * 100) : 0;

  const funnelData = [
    { label: '고민 등록', value: concerns.filter(c => c.status !== 'draft').length },
    { label: '제안 발송', value: proposals.filter(p => p.status !== 'draft').length },
    { label: '열람', value: viewedCount },
    { label: '비교', value: concerns.filter(c => c.status === 'comparing').length },
    { label: '선택', value: selectedCount },
  ];

  const statusPieData = ['submitted', 'proposal_received', 'comparing', 'hospital_selected', 'completed'].map(status => ({
    name: STATUS_LABELS[status] || status,
    value: concerns.filter(c => c.status === status).length,
    status,
  }));

  const proposalBarData = ['sent', 'viewed', 'shortlisted', 'selected', 'rejected'].map(status => ({
    name: PROPOSAL_STATUS_LABELS[status] || status,
    value: proposals.filter(p => p.status === status).length,
    status,
  }));

  const areaCounts = concerns.reduce<Record<string, number>>((acc, c) => {
    const area = c.primaryArea || '기타';
    acc[area] = (acc[area] ?? 0) + 1;
    return acc;
  }, {});
  const bodyAreaData = Object.entries(areaCounts)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  return (
    <AdminPage sidebar={<BOSidebar active="/dashboard" />} title="통합 대시보드" prefix="bo">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* 헤더 + 기간 필터 */}
        <DashboardHeader />

        {/* KPI */}
        <BODashboardKPI
          buyerCount={buyers.length}
          partnerCount={partners.length}
          concernCount={concerns.length}
          proposalCount={proposals.length}
          totalRevenue={totalRevenue}
          viewRate={viewRate}
          selectRate={selectRate}
        />

        {/* 전환 퍼널 */}
        <div style={{
          background: '#fff', borderRadius: 16, padding: 24,
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)', border: '1px solid #f1f5f9',
        }}>
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 15, fontWeight: 650, color: '#0f172a' }}>전환 퍼널</div>
            <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>고민 등록 → 병원 선택 | 선택률 {selectRate}%</div>
          </div>
          <ConversionFunnel data={funnelData} />
        </div>

        {/* 차트 1행: 고민 상태 도넛 + 제안서 바 */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div style={{
            background: '#fff', borderRadius: 16, padding: 24,
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)', border: '1px solid #f1f5f9',
          }}>
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 15, fontWeight: 650, color: '#0f172a' }}>고민 상태 분포</div>
              <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>총 {concerns.length}건</div>
            </div>
            <ConcernStatusPie data={statusPieData} total={concerns.length} />
          </div>

          <div style={{
            background: '#fff', borderRadius: 16, padding: 24,
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)', border: '1px solid #f1f5f9',
          }}>
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 15, fontWeight: 650, color: '#0f172a' }}>제안서 현황</div>
              <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>총 {proposals.length}건</div>
            </div>
            <ProposalStatusBar data={proposalBarData} />
          </div>
        </div>

        {/* 차트 2행: 부위 트리맵 + 최근 이벤트 */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div style={{
            background: '#fff', borderRadius: 16, padding: 24,
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)', border: '1px solid #f1f5f9',
          }}>
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 15, fontWeight: 650, color: '#0f172a' }}>부위별 고민 분포</div>
              <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>총 {concerns.length}건</div>
            </div>
            <BodyAreaTreemap data={bodyAreaData} total={concerns.length} />
          </div>

          <div style={{
            background: '#fff', borderRadius: 16, padding: 24,
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)', border: '1px solid #f1f5f9',
            display: 'flex', flexDirection: 'column',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 650, color: '#0f172a' }}>최근 이벤트</div>
                <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>{events.length}건</div>
              </div>
              <Link href="/events" style={{
                fontSize: 13, fontWeight: 500, color: '#18181b', textDecoration: 'none',
                padding: '4px 10px', borderRadius: 6, border: '1px solid #e5e7eb',
              }}>전체보기</Link>
            </div>
            {events.length === 0 ? (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: 13 }}>
                아직 이벤트가 없습니다
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                {events.slice(0, 6).map((ev, i) => {
                  const label = EVENT_KR[ev.eventType] || ev.eventType;
                  const style = EVENT_STYLE[ev.eventType] || { bg: '#f1f5f9', text: '#475569' };
                  return (
                    <div key={ev.id} style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '10px 0',
                      borderBottom: i < 5 ? '1px solid #f8fafc' : 'none',
                    }}>
                      <span style={{
                        display: 'inline-block', padding: '3px 10px', borderRadius: 6,
                        fontSize: 12, fontWeight: 500, background: style.bg, color: style.text,
                      }}>{label}</span>
                      <span style={{ fontSize: 11, color: '#94a3b8', fontVariantNumeric: 'tabular-nums' }}>
                        {new Date(ev.timestamp).toLocaleTimeString('ko', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

      </div>
    </AdminPage>
  );
}

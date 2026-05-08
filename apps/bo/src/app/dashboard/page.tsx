'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AdminPage, Spinner } from '@hyliren/ui';
import { BOSidebar } from '@/components/BOSidebar';
import { ConcernStatusPie, ProposalStatusBar, ConversionFunnel, BodyAreaTreemap } from '@/components/DashboardCharts';
import { BODashboardKPI } from '@/components/BODashboardKPI';
import { DashboardHeader } from '@/components/DashboardHeader';
import { getDashboardSummary, type AdminDashboardSummary } from '@/lib/api/admin-dashboard';

const EVENT_KR: Record<string, string> = {
  concern_submit: '고민 등록',
  proposal_send: '제안서 발송',
  proposal_view: '제안서 열람',
  page_view: '페이지 조회',
  report_purchase: '리포트 구매',
};

// admin BE 가 enum key 만 노출 (한국어 라벨 BE 박지 않음 — customer/partner PR #51-57 정합).
// dashboard 화면 표시는 BO 측에서 매핑.
const CONCERN_STATUS_LABEL_KR: Record<string, string> = {
  submitted: '등록',
  proposal_received: '제안 도착',
  comparing: '비교 중',
  hospital_selected: '병원 선택',
  completed: '완료',
};

const PROPOSAL_STATUS_LABEL_KR: Record<string, string> = {
  sent: '발송',
  viewed: '열람',
  shortlisted: '후보',
  selected: '선택',
  rejected: '거절',
};

function localizeStatusItems<T extends { name: string; status: string }>(items: T[], map: Record<string, string>): T[] {
  return items.map((it) => ({ ...it, name: map[it.status] ?? it.name }));
}

const EVENT_STYLE: Record<string, { bg: string; text: string }> = {
  concern_submit: { bg: '#EEF2FF', text: '#4F46E5' },
  proposal_send: { bg: '#F5F3FF', text: '#8B5CF6' },
  proposal_view: { bg: '#ECFDF5', text: '#10B981' },
  page_view: { bg: '#F8FAFC', text: '#64748B' },
  report_purchase: { bg: '#FFF1F2', text: '#F43F5E' },
};

export default function DashboardPage() {
  const [data, setData] = useState<AdminDashboardSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getDashboardSummary()
      .then((d) => { if (!cancelled) setData(d); })
      .catch((e: unknown) => {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : '대시보드를 불러오지 못했습니다.');
      });
    return () => { cancelled = true; };
  }, []);

  return (
    <AdminPage sidebar={<BOSidebar active="/dashboard" />} title="통합 대시보드" prefix="bo">
      {error ? (
        <div style={{ padding: 24, color: 'var(--color-danger,#d72c0d)', fontSize: 13 }}>{error}</div>
      ) : !data ? (
        <div style={{ minHeight: 240, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Spinner />
        </div>
      ) : (
        <DashboardContent data={data} />
      )}
    </AdminPage>
  );
}

function DashboardContent({ data }: { data: AdminDashboardSummary }) {
  const { kpi, funnel, bodyAreaDistribution, recentEvents } = data;
  const concernStatusPie = localizeStatusItems(data.concernStatusPie, CONCERN_STATUS_LABEL_KR);
  const proposalStatusBar = localizeStatusItems(data.proposalStatusBar, PROPOSAL_STATUS_LABEL_KR);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* 헤더 + 기간 필터 */}
      <DashboardHeader />

      {/* KPI */}
      <BODashboardKPI
        buyerCount={kpi.buyerCount}
        partnerCount={kpi.partnerCount}
        concernCount={kpi.concernCount}
        proposalCount={kpi.proposalCount}
        totalRevenue={kpi.totalRevenue}
        viewRate={kpi.viewRate}
        selectRate={kpi.selectRate}
      />

      {/* 전환 퍼널 */}
      <div style={{
        background: '#fff', borderRadius: 16, padding: 24,
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)', border: '1px solid #f1f5f9',
      }}>
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 15, fontWeight: 650, color: '#0f172a' }}>전환 퍼널</div>
          <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>고민 등록 → 병원 선택 | 선택률 {kpi.selectRate}%</div>
        </div>
        <ConversionFunnel data={funnel} />
      </div>

      {/* 차트 1행: 고민 상태 도넛 + 제안서 바 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div style={{
          background: '#fff', borderRadius: 16, padding: 24,
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)', border: '1px solid #f1f5f9',
        }}>
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 15, fontWeight: 650, color: '#0f172a' }}>고민 상태 분포</div>
            <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>총 {kpi.concernCount}건</div>
          </div>
          <ConcernStatusPie data={concernStatusPie} total={kpi.concernCount} />
        </div>

        <div style={{
          background: '#fff', borderRadius: 16, padding: 24,
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)', border: '1px solid #f1f5f9',
        }}>
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 15, fontWeight: 650, color: '#0f172a' }}>제안서 현황</div>
            <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>총 {kpi.proposalCount}건</div>
          </div>
          <ProposalStatusBar data={proposalStatusBar} />
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
            <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>총 {kpi.concernCount}건</div>
          </div>
          <BodyAreaTreemap data={bodyAreaDistribution} total={kpi.concernCount} />
        </div>

        <div style={{
          background: '#fff', borderRadius: 16, padding: 24,
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)', border: '1px solid #f1f5f9',
          display: 'flex', flexDirection: 'column',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 650, color: '#0f172a' }}>최근 이벤트</div>
              <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>{recentEvents.length}건</div>
            </div>
            <Link href="/events" style={{
              fontSize: 13, fontWeight: 500, color: '#18181b', textDecoration: 'none',
              padding: '4px 10px', borderRadius: 6, border: '1px solid #e5e7eb',
            }}>전체보기</Link>
          </div>
          {recentEvents.length === 0 ? (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: 13 }}>
              아직 이벤트가 없습니다
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {recentEvents.slice(0, 6).map((ev, i) => {
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
  );
}

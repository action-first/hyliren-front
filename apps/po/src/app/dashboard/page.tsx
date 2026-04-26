'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import type { ProposalStatus } from '@hyliren/shared';
import {
  CONCERN_STATUS_KR, PROPOSAL_STATUS_KR, BODY_AREA_BADGE,
  formatBudget, formatDateRange,
  isProposalAccepted,
} from '@hyliren/shared';
import { AdminPage, Card, Button, DateFilter } from '@hyliren/ui';
import type { DateRange } from '@hyliren/ui';
import { POSidebar } from '@/components/POSidebar';
import { useCreditsStore } from '@/store/credits';
import { useToastStore } from '@/store/toast';
import { listConcerns, type ConcernSummaryWire } from '@/lib/api/concern';
import { listMyProposals, type ProposalDetailWire } from '@/lib/api/proposal';
import {
  FileText, Eye, CheckCircle2, Coins,
  TrendingUp, TrendingDown, ArrowRight, Sparkles,
  AlertTriangle,
} from 'lucide-react';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  AreaChart, Area,
} from 'recharts';

// ── 색상 시스템 (BO와 동일한 팔레트) ──
const C = {
  main:         '#4F46E5', // 인디고 (PO 시그니처)
  sub:          '#8B5CF6', // 바이올렛
  positive:     '#10B981', // 에메랄드
  negative:     '#F43F5E', // 로즈
  neutral:      '#94A3B8', // 슬레이트
  neutralLight: '#CBD5E1', // 라이트 슬레이트
};

const STATUS_COLORS: Record<string, { hex: string; label: string }> = {
  selected:    { hex: C.main,         label: '선택됨' },
  shortlisted: { hex: C.sub,          label: '후보' },
  viewed:      { hex: C.neutralLight, label: '열람' },
  sent:        { hex: C.neutral,      label: '발송' },
  rejected:    { hex: C.negative,     label: '거절' },
  draft:       { hex: '#E2E8F0',      label: '임시저장' },
};

const AREA_COLORS: Record<string, string> = {
  '눈':       C.main,
  '코':       '#818CF8', // 인디고 300
  '리프팅':   C.sub,
  '피부':     '#A78BFA', // 바이올렛 300
  '다이어트': '#6366F1', // 인디고 500
  '기타':     C.neutral,
};

const CONCERN_STATUS_STYLE: Record<string, { bg: string; text: string; dot: string }> = {
  '접수됨':     { bg: '#f1f5f9', text: '#475569', dot: C.neutral },
  '제안 도착':  { bg: '#eef2ff', text: '#3730a3', dot: C.main },
  '제안 수신':  { bg: '#eef2ff', text: '#3730a3', dot: C.main },
  '비교 중':    { bg: '#f5f3ff', text: '#5b21b6', dot: C.sub },
  '진행 중':    { bg: '#f5f3ff', text: '#5b21b6', dot: C.sub },
  '완료':       { bg: '#ecfdf5', text: '#065f46', dot: C.positive },
};

const AREA_BADGE_STYLE: Record<string, { bg: string; text: string }> = {
  '눈':       { bg: '#eef2ff', text: '#3730a3' },
  '코':       { bg: '#eef2ff', text: '#4338ca' },
  '리프팅':   { bg: '#f5f3ff', text: '#6d28d9' },
  '피부':     { bg: '#f5f3ff', text: '#7c3aed' },
  '다이어트': { bg: '#eef2ff', text: '#4f46e5' },
  '기타':     { bg: '#f1f5f9', text: '#475569' },
};

const TOOLTIP_STYLE: React.CSSProperties = {
  fontSize: 13, borderRadius: 10, border: 'none',
  boxShadow: '0 4px 20px rgba(0,0,0,0.1)', padding: '10px 14px',
  background: 'var(--surface-default)',
};

function shortDate(iso: string) {
  const parts = iso.split('-');
  if (parts.length === 3) return `${parseInt(parts[1])}/${parseInt(parts[2])}`;
  return iso;
}

function formatLocalDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function recentDays(n: number, end = new Date()): string[] {
  const dates: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    dates.push(formatLocalDate(addDays(end, -i)));
  }
  return dates;
}

function daysBetween(from: Date, to: Date): string[] {
  const start = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  const end = new Date(to.getFullYear(), to.getMonth(), to.getDate());
  const dates: string[] = [];
  for (let cursor = start; cursor <= end; cursor = addDays(cursor, 1)) {
    dates.push(formatLocalDate(cursor));
  }
  return dates;
}

function resolveDateWindow(range: DateRange, customFrom?: Date | null, customTo?: Date | null): { from: string; to: string; days: string[]; label: string } {
  const today = new Date();
  if (range === 'today') {
    const day = formatLocalDate(today);
    return { from: day, to: day, days: [day], label: '오늘' };
  }
  if (range === '7d') {
    const days = recentDays(7, today);
    return { from: days[0], to: days[days.length - 1], days, label: '최근 7일' };
  }
  if (range === 'custom' && customFrom) {
    const to = customTo ?? customFrom;
    const days = daysBetween(customFrom, to);
    return { from: days[0], to: days[days.length - 1], days, label: '사용자 지정 기간' };
  }
  const days = recentDays(30, today);
  return { from: days[0], to: days[days.length - 1], days, label: '최근 30일' };
}

function isDateInWindow(value: string | null | undefined, from: string, to: string): boolean {
  if (!value) return false;
  const day = value.slice(0, 10);
  return day >= from && day <= to;
}

// ── KPI 카드 컴포넌트 (컴팩트 — 아이콘 좌측, 1줄 구성) ──
function KPICard({ icon, iconBg, label, value, sub, trend, trendUp }: {
  icon: React.ReactNode; iconBg: string;
  label: string; value: string | number; sub?: string;
  trend?: string; trendUp?: boolean;
}) {
  return (
    <div style={{
      background: 'var(--surface-default)', borderRadius: 14, padding: '16px 20px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.02)',
      display: 'flex', alignItems: 'center', gap: 14,
      border: '1px solid #f1f5f9',
      transition: 'box-shadow 200ms, transform 200ms',
    }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.06)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.02)'; e.currentTarget.style.transform = 'translateY(0)'; }}
    >
      <div style={{
        width: 36, height: 36, borderRadius: 9, background: iconBg,
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>{icon}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-disabled)', letterSpacing: '0.02em' }}>{label}</div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 2 }}>
          <span style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-default)', letterSpacing: '-0.02em', lineHeight: 1 }}>{value}</span>
          {sub && <span style={{ fontSize: 11, color: 'var(--text-disabled)' }}>{sub}</span>}
        </div>
      </div>
      {trend && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 3, flexShrink: 0,
          fontSize: 11, fontWeight: 600,
          color: trendUp ? '#10b981' : '#ef4444',
          background: trendUp ? '#ecfdf5' : '#fef2f2',
          padding: '3px 8px', borderRadius: 20,
        }}>
          {trendUp ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
          {trend}
        </div>
      )}
    </div>
  );
}

// ── 차트 카드 래퍼 ──
function ChartCard({ title, subtitle, children, action }: {
  title: string; subtitle?: string; children: React.ReactNode; action?: React.ReactNode;
}) {
  return (
    <div style={{
      background: 'var(--surface-default)', borderRadius: 16, padding: 24,
      boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.02)',
      border: '1px solid #f1f5f9',
      display: 'flex', flexDirection: 'column',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 650, color: 'var(--text-default)' }}>{title}</div>
          {subtitle && <div style={{ fontSize: 12, color: 'var(--text-disabled)', marginTop: 2 }}>{subtitle}</div>}
        </div>
        {action}
      </div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        {children}
      </div>
    </div>
  );
}

// ── 커스텀 도넛 센터 라벨 ──
function DonutCenterLabel({ cx, cy, total, label }: { cx: number; cy: number; total: number; label: string }) {
  return (
    <g>
      <text x={cx} y={cy - 6} textAnchor="middle" style={{ fontSize: 22, fontWeight: 700, fill: 'var(--text-default)' }}>{total}</text>
      <text x={cx} y={cy + 14} textAnchor="middle" style={{ fontSize: 11, fontWeight: 500, fill: 'var(--text-disabled)' }}>{label}</text>
    </g>
  );
}

// ── 커스텀 트리맵 (squarified layout) ──
function AreaTreemap({ data, total }: { data: { name: string; value: number; color: string }[]; total: number }) {
  const sorted = [...data].sort((a, b) => b.value - a.value);
  const sum = sorted.reduce((s, d) => s + d.value, 0);
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 400, h: 200 });

  useEffect(() => {
    if (!containerRef.current) return;
    const obs = new ResizeObserver(entries => {
      const { width } = entries[0].contentRect;
      setSize({ w: width, h: 200 });
    });
    obs.observe(containerRef.current);
    return () => obs.disconnect();
  }, []);

  // simple slice-and-dice layout
  const rects: { x: number; y: number; w: number; h: number; name: string; value: number; color: string; pct: number }[] = [];
  let x = 0;
  const gap = 4;
  sorted.forEach(d => {
    const ratio = d.value / sum;
    const w = Math.max(ratio * size.w - gap, 0);
    rects.push({ x: x + gap / 2, y: 0, w, h: size.h, name: d.name, value: d.value, color: d.color, pct: total > 0 ? Math.round((d.value / total) * 100) : 0 });
    x += ratio * size.w;
  });

  return (
    <div ref={containerRef} style={{ width: '100%', height: 200 }}>
      <svg width={size.w} height={size.h}>
        {rects.map((r, i) => (
          <g key={i}>
            <rect x={r.x} y={r.y} width={r.w} height={r.h} rx={10} ry={10}
              fill={r.color} fillOpacity={0.78}
              style={{ transition: 'fill-opacity 200ms, transform 100ms', cursor: 'pointer' }}
              onMouseEnter={e => { e.currentTarget.style.fillOpacity = '1'; }}
              onMouseLeave={e => { e.currentTarget.style.fillOpacity = '0.78'; }}
            />
            {r.w > 44 && r.h > 50 && (
              <>
                <text x={r.x + r.w / 2} y={r.h / 2 - 14} textAnchor="middle"
                  style={{ fontSize: 14, fontWeight: 700, fill: '#fff', pointerEvents: 'none' }}>{r.name}</text>
                <text x={r.x + r.w / 2} y={r.h / 2 + 6} textAnchor="middle"
                  style={{ fontSize: 20, fontWeight: 800, fill: '#fff', pointerEvents: 'none' }}>{r.value}</text>
                <text x={r.x + r.w / 2} y={r.h / 2 + 24} textAnchor="middle"
                  style={{ fontSize: 11, fontWeight: 500, fill: 'rgba(255,255,255,0.7)', pointerEvents: 'none' }}>{r.pct}%</text>
              </>
            )}
          </g>
        ))}
      </svg>
    </div>
  );
}

// ── 커스텀 범례 ──
function CustomLegend({ payload }: { payload?: Array<{ value: string; color: string; payload?: { value: number } }> }) {
  if (!payload) return null;
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 16px', justifyContent: 'center', marginTop: 8 }}>
      {payload.map((entry, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: entry.color, flexShrink: 0 }} />
          <span style={{ fontSize: 12, color: 'var(--text-subdued)' }}>{entry.value}</span>
          <span style={{ fontSize: 12, fontWeight: 600, color: '#334155' }}>{entry.payload?.value}</span>
        </div>
      ))}
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// 메인
// ════════════════════════════════════════════════════════════
export default function DashboardPage() {
  const { balance, transactions } = useCreditsStore();
  const showToast = useToastStore(s => s.showToast);

  const [dateRange, setDateRange] = useState<DateRange>('7d');
  const [customFrom, setCustomFrom] = useState<Date | null>(null);
  const [customTo, setCustomTo] = useState<Date | null>(null);
  const [concerns, setConcerns] = useState<ConcernSummaryWire[]>([]);
  const [proposals, setProposals] = useState<ProposalDetailWire[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setLoadError(null);
    Promise.all([listConcerns(), listMyProposals()])
      .then(([concernData, proposalData]) => {
        setConcerns(concernData.concerns ?? []);
        setProposals(proposalData.proposals ?? []);
      })
      .catch((e: unknown) => {
        const msg = e instanceof Error ? e.message : '대시보드 데이터를 불러올 수 없습니다';
        setLoadError(msg);
        showToast(msg, 'error');
      })
      .finally(() => setLoading(false));
  }, [showToast]);

  useEffect(() => { load(); }, [load]);

  const dateWindow = resolveDateWindow(dateRange, customFrom, customTo);
  const periodConcerns = concerns.filter(c => isDateInWindow(c.createdAt, dateWindow.from, dateWindow.to));
  const periodProposals = proposals.filter(p => isDateInWindow(p.sentAt ?? p.createdAt, dateWindow.from, dateWindow.to));
  const periodTransactions = transactions.filter(tx => isDateInWindow(tx.date, dateWindow.from, dateWindow.to));

  // KPI
  const openConcerns = periodConcerns.filter(c => c.status === 'submitted' || c.status === 'proposal_received');
  const myProposals = periodProposals;
  const viewedCount = myProposals.filter(p => p.viewedAt !== null).length;
  const viewRate = myProposals.length > 0 ? Math.round((viewedCount / myProposals.length) * 100) : 0;
  const selectedCount = myProposals.filter(p => isProposalAccepted({ status: p.status as ProposalStatus })).length;
  const selectedRate = myProposals.length > 0 ? Math.round((selectedCount / myProposals.length) * 100) : 0;

  // 도넛 — 제안서 상태
  const statusGroups = myProposals.reduce<Record<string, number>>((acc, p) => {
    acc[p.status] = (acc[p.status] ?? 0) + 1; return acc;
  }, {});
  const pieData = Object.entries(statusGroups).map(([status, count]) => ({
    name: STATUS_COLORS[status]?.label ?? status,
    value: count,
    color: STATUS_COLORS[status]?.hex ?? '#94a3b8',
  }));

  // 도넛 — 부위별 분포
  const areaGroups = periodConcerns.reduce<Record<string, number>>((acc, c) => {
    acc[c.primaryArea] = (acc[c.primaryArea] ?? 0) + 1; return acc;
  }, {});
  const areaPieData = Object.entries(areaGroups).map(([area, count]) => ({
    name: area, value: count, color: AREA_COLORS[area] ?? '#94a3b8',
  }));

  // 기간별 제안 추이
  const days = dateWindow.days;
  const trendData = days.map(date => {
    const sent = myProposals.filter(p => p.sentAt?.slice(0, 10) === date).length;
    const viewed = myProposals.filter(p => p.viewedAt?.slice(0, 10) === date).length;
    return { date: shortDate(date), 발송: sent, 열람: viewed };
  });

  // 크레딧 일별 집계
  const creditDailyData = days.map(date => {
    const txs = periodTransactions.filter(tx => tx.date.slice(0, 10) === date);
    const charge = txs.filter(tx => tx.amount > 0).reduce((sum, tx) => sum + tx.amount, 0);
    const spend = txs.filter(tx => tx.amount < 0).reduce((sum, tx) => sum + Math.abs(tx.amount), 0);
    return { name: shortDate(date), 충전: charge, 사용: spend, 순증감: charge - spend };
  });
  const hasCreditDailyData = creditDailyData.some(d => d.충전 > 0 || d.사용 > 0);

  // ── 로딩 ──
  if (loading) {
    return (
      <AdminPage sidebar={<POSidebar active="/dashboard" />} title="대시보드" prefix="po">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
          {[1,2,3,4].map(i => (
            <div key={i} style={{ background: 'var(--surface-default)', borderRadius: 16, padding: 24, border: '1px solid var(--border-subdued)' }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--surface-hovered)', marginBottom: 16 }} />
              <div style={{ width: 60, height: 10, background: 'var(--surface-hovered)', borderRadius: 6, marginBottom: 8 }} />
              <div style={{ width: 80, height: 28, background: 'var(--surface-hovered)', borderRadius: 6 }} />
            </div>
          ))}
        </div>
      </AdminPage>
    );
  }

  // ── 에러 ── (treatments 패턴 일관: AlertTriangle + msg + 다시 시도)
  if (loadError) {
    return (
      <AdminPage sidebar={<POSidebar active="/dashboard" />} title="대시보드" prefix="po">
        <Card padding="md">
          <div className="text-center py-10">
            <AlertTriangle size={28} className="mx-auto mb-2 text-[var(--color-danger)]" />
            <p className="text-[var(--text-sm)] font-medium text-[var(--text-default)] mb-1">
              대시보드를 불러오지 못했어요
            </p>
            <p className="text-[var(--text-xs)] text-[var(--text-disabled)] mb-4">{loadError}</p>
            <Button variant="secondary" size="sm" onClick={load}>
              다시 시도
            </Button>
          </div>
        </Card>
      </AdminPage>
    );
  }

  return (
    <AdminPage sidebar={<POSidebar active="/dashboard" />} title="대시보드" prefix="po">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* ═══ 기간 필터 ═══ */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-default)', margin: 0 }}>운영 현황</h2>
            <p style={{ fontSize: 13, color: 'var(--text-disabled)', marginTop: 2 }}>
              {dateWindow.label} 기준
            </p>
          </div>
          <DateFilter
            value={dateRange}
            onChange={(range, from, to) => {
              setDateRange(range);
              setCustomFrom(from ?? null);
              setCustomTo(to ?? null);
            }}
          />
        </div>

        {/* ═══ KPI 카드 ═══ */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
          <KPICard
            icon={<Sparkles size={20} color={C.main} />}
            iconBg="#eef2ff"
            label="새 고민"
            value={openConcerns.length}
            sub="제안 가능한 고민"
            trend="+2건" trendUp
          />
          <KPICard
            icon={<FileText size={20} color={C.sub} />}
            iconBg="#f5f3ff"
            label="발송 제안서"
            value={myProposals.length}
            sub={`열람률 ${viewRate}%`}
            trend={`${viewRate}%`} trendUp={viewRate > 50}
          />
          <KPICard
            icon={<CheckCircle2 size={20} color="#10b981" />}
            iconBg="#ecfdf5"
            label="선택률"
            value={`${selectedRate}%`}
            sub={`${selectedCount}건 선택`}
            trend={selectedRate > 0 ? `${selectedRate}%` : undefined}
            trendUp={selectedRate > 30}
          />
          <KPICard
            icon={<Coins size={20} color="#f59e0b" />}
            iconBg="#fffbeb"
            label="크레딧 잔액"
            value={balance}
            sub={`${Math.floor(balance / 3)}건 발송 가능`}
          />
        </div>

        {/* ═══ 차트 1행: 제안서 현황(도넛) + 주간 제안 추이(에어리어) ═══ */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <ChartCard title="제안서 현황" subtitle={`총 ${myProposals.length}건`}>
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="44%" innerRadius={62} outerRadius={85} paddingAngle={3} dataKey="value" stroke="none" cornerRadius={4}>
                    {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(value, name) => [`${Number(value)}건`, String(name)]} />
                  <Legend content={<CustomLegend />} />
                  <text x="50%" y="42%" textAnchor="middle" style={{ fontSize: 24, fontWeight: 700, fill: 'var(--text-default)' }}>{myProposals.length}</text>
                  <text x="50%" y="50%" textAnchor="middle" style={{ fontSize: 11, fontWeight: 500, fill: 'var(--text-disabled)' }}>총 제안</text>
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 240, color: 'var(--text-disabled)', fontSize: 13 }}>
                발송한 제안서가 없습니다.
              </div>
            )}
          </ChartCard>

          <ChartCard title="제안 추이" subtitle={dateWindow.label}>
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={trendData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradSent" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={C.main} stopOpacity={0.12} />
                    <stop offset="100%" stopColor={C.main} stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradViewed" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={C.positive} stopOpacity={0.12} />
                    <stop offset="100%" stopColor={C.positive} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subdued)" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'var(--text-disabled)' }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--text-disabled)' }} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Area type="monotone" dataKey="발송" stroke={C.main} strokeWidth={2} fill="url(#gradSent)" dot={{ r: 3, fill: C.main, strokeWidth: 0 }} activeDot={{ r: 5, fill: C.main, stroke: '#fff', strokeWidth: 2 }} />
                <Area type="monotone" dataKey="열람" stroke={C.positive} strokeWidth={2} fill="url(#gradViewed)" dot={{ r: 3, fill: C.positive, strokeWidth: 0 }} activeDot={{ r: 5, fill: C.positive, stroke: '#fff', strokeWidth: 2 }} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
                  formatter={(value: string) => <span style={{ fontSize: 12, color: 'var(--text-subdued)', marginLeft: 2 }}>{value}</span>}
                />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {/* ═══ 차트 2행: 부위별 고민 분포(바) + 크레딧 내역(바) ═══ */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <ChartCard title="부위별 고민 분포" subtitle={`총 ${periodConcerns.length}건`}>
            {areaPieData.length > 0 ? (
              <AreaTreemap data={areaPieData} total={periodConcerns.length} />
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 220, color: 'var(--text-disabled)', fontSize: 13 }}>
                고민 데이터가 없습니다.
              </div>
            )}
          </ChartCard>

          <ChartCard title="크레딧 내역" subtitle={`${dateWindow.label} 일별 집계`}>
            {hasCreditDailyData ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={creditDailyData} margin={{ top: 8, right: 4, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subdued)" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--text-disabled)' }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: 'var(--text-disabled)' }} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: 'rgba(79,70,229,0.04)' }}
                    formatter={(value, name) => [`${Number(value)}크레딧`, String(name)]}
                  />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
                    formatter={(value: string) => <span style={{ fontSize: 12, color: 'var(--text-subdued)', marginLeft: 2 }}>{value}</span>}
                  />
                  <Bar dataKey="충전" fill={C.main} fillOpacity={0.85} radius={[6, 6, 0, 0]} maxBarSize={28} />
                  <Bar dataKey="사용" fill={C.negative} fillOpacity={0.82} radius={[6, 6, 0, 0]} maxBarSize={28} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 220, color: 'var(--text-disabled)', fontSize: 13 }}>
                거래 내역이 없습니다.
              </div>
            )}
          </ChartCard>
        </div>

        {/* ═══ 최근 고민 테이블 ═══ */}
        <div style={{
          background: 'var(--surface-default)', borderRadius: 16, overflow: 'hidden',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.02)',
          border: '1px solid #f1f5f9',
        }}>
          {/* 헤더 */}
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '18px 24px',
          }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 650, color: 'var(--text-default)' }}>최근 고민</div>
              <div style={{ fontSize: 12, color: 'var(--text-disabled)', marginTop: 2 }}>{openConcerns.length}건의 제안 가능한 고민</div>
            </div>
            <Link href="/concerns" style={{
              display: 'inline-flex', alignItems: 'center', gap: 4,
              fontSize: 13, fontWeight: 500, color: C.main, textDecoration: 'none',
              padding: '6px 12px', borderRadius: 8, transition: 'background 150ms',
            }}
              onMouseEnter={e => (e.currentTarget.style.background = '#eef2ff')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              전체보기 <ArrowRight size={14} />
            </Link>
          </div>

          {/* 테이블 */}
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--surface-subdued)' }}>
                {['부위', '예산', '방문 시기', '상태', ''].map((h, i) => (
                  <th key={i} style={{
                    padding: '10px 24px', fontSize: 11, fontWeight: 600, color: 'var(--text-disabled)',
                    textAlign: 'left', letterSpacing: '0.05em', textTransform: 'uppercase' as const,
                    borderTop: '1px solid #f1f5f9', borderBottom: '1px solid #f1f5f9',
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {openConcerns.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-disabled)', padding: '40px 0', fontSize: 13 }}>
                    새로 들어온 고민이 없습니다.
                  </td>
                </tr>
              )}
              {openConcerns.slice(0, 5).map(c => {
                const statusLabel = CONCERN_STATUS_KR[c.status] ?? c.status;
                const statusStyle = CONCERN_STATUS_STYLE[statusLabel] ?? { bg: '#f1f5f9', text: '#475569', dot: '#94a3b8' };
                const areaStyle = AREA_BADGE_STYLE[c.primaryArea] ?? { bg: '#f1f5f9', text: '#475569' };

                return (
                  <tr key={c.id} style={{ borderBottom: '1px solid #f8fafc', transition: 'background 150ms', cursor: 'pointer' }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#fafbfe')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <td style={{ padding: '14px 24px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{
                          display: 'inline-block', padding: '3px 10px', borderRadius: 6,
                          fontSize: 12, fontWeight: 600, background: areaStyle.bg, color: areaStyle.text,
                        }}>{c.primaryArea}</span>
                        {c.bodyAreaDetail && <span style={{ fontSize: 13, color: 'var(--text-subdued)' }}>{c.bodyAreaDetail}</span>}
                      </div>
                    </td>
                    <td style={{ padding: '14px 24px', fontSize: 13, color: '#334155', fontVariantNumeric: 'tabular-nums' }}>
                      {formatBudget(c.budgetMin, c.budgetMax)}
                    </td>
                    <td style={{ padding: '14px 24px', fontSize: 13, color: 'var(--text-subdued)' }}>
                      {formatDateRange(c.visitDateFrom, c.visitDateTo)}
                    </td>
                    <td style={{ padding: '14px 24px' }}>
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: 5,
                        padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 500,
                        background: statusStyle.bg, color: statusStyle.text,
                      }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: statusStyle.dot }} />
                        {statusLabel}
                      </span>
                    </td>
                    <td style={{ padding: '14px 24px' }}>
                      <Link href={`/concerns/${c.id}`} style={{
                        fontSize: 13, fontWeight: 500, color: C.main, textDecoration: 'none',
                      }}>보기</Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

      </div>
    </AdminPage>
  );
}

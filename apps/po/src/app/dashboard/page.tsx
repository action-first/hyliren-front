'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import type { ProposalStatus } from '@hyliren/shared';
import {
  BODY_AREA_BADGE,
  formatBudget, formatDateRange,
  isProposalAccepted,
} from '@hyliren/shared';
import { AdminPage, Card, Button, DateFilter } from '@hyliren/ui';
import type { DateRange } from '@hyliren/ui';
import { POSidebar } from '@/components/POSidebar';
import { useCreditBalance, useCreditTransactions } from '@/hooks/queries/credits';
import { useToastStore } from '@/store/toast';
import { useLocaleStore } from '@/store/locale';
import { useDateFilterLabels } from '@/hooks/useDateFilterLabels';
import { toUserMessage } from '@/lib/api/error-messages';
import { useConcerns } from '@/hooks/queries/concerns';
import { useMyProposals } from '@/hooks/queries/proposals';
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

/*
  대시보드 색상 시스템 — 카테고리별 단일 소스.

  원칙:
  - 차트 (recharts) 는 hex 리터럴 필요 → CHART 팔레트로 한곳에 모음
  - 배지 (DOM) 는 CSS 토큰 사용 → admin.css 의 semantic tokens 직접 참조
  - 한 색상이 차트·배지에 동시 등장하면 같은 카테고리 객체에서 함께 정의
  - 이전엔 STATUS_COLORS / AREA_COLORS / CONCERN_STATUS_STYLE / AREA_BADGE_STYLE
    4개 맵에 hex 가 분산 → 변경 시 4 군데 수정 필요했음. 이를 카테고리 단위로 통합.
*/

/** 차트 팔레트 — recharts Cell 등에 직접 전달. hex 리터럴 필요. */
const CHART_PALETTE = {
  primary:      '#4F46E5', // 인디고 (PO 시그니처)
  secondary:    '#8B5CF6', // 바이올렛
  positive:     '#10B981', // 에메랄드
  negative:     '#F43F5E', // 로즈
  neutral:      '#94A3B8', // 슬레이트
  neutralLight: '#CBD5E1',
} as const;

/** 제안서 상태 팔레트 — 차트 색상만. label 은 컴포넌트 내부에서 t() 매핑. */
const PROPOSAL_HEX: Record<string, string> = {
  selected:    CHART_PALETTE.primary,
  shortlisted: CHART_PALETTE.secondary,
  viewed:      CHART_PALETTE.neutralLight,
  sent:        CHART_PALETTE.neutral,
  rejected:    CHART_PALETTE.negative,
  draft:       '#E2E8F0',
};

/** 부위 팔레트 — 차트 색상 (BodyArea enum key 기반, Stage 3 정렬). */
const AREA_CHART_HEX: Record<string, string> = {
  eyes:    CHART_PALETTE.primary,
  nose:    '#818CF8',
  lifting: CHART_PALETTE.secondary,
  skin:    '#A78BFA',
  diet:    '#6366F1',
  etc:     CHART_PALETTE.neutral,
};

/** concern.status enum (snake_case) → i18n key (camelCase 네임스페이스 lifecycle.status.*). */
const CONCERN_STATUS_I18N_KEY: Record<string, string> = {
  draft:             'lifecycle.status.draft',
  submitted:         'lifecycle.status.submitted',
  proposal_received: 'lifecycle.status.proposalReceived',
  comparing:         'lifecycle.status.comparing',
  report_purchased:  'lifecycle.status.reportPurchased',
  hospital_selected: 'lifecycle.status.hospitalSelected',
  service_purchased: 'lifecycle.status.servicePurchased',
  completed:         'lifecycle.status.completed',
  cancelled:         'lifecycle.status.cancelled',
};

/** 고민 상태 배지 — concern.status enum key 기반 (한국어 키 매핑 폐기). */
const CONCERN_STATUS_BADGE: Record<string, { bg: string; text: string; dot: string }> = {
  submitted:         { bg: 'var(--surface-subdued)',     text: 'var(--text-subdued)',  dot: CHART_PALETTE.neutral },
  proposal_received: { bg: 'var(--color-info-soft)',     text: 'var(--color-info)',    dot: CHART_PALETTE.primary },
  comparing:         { bg: 'var(--color-primary-soft)',  text: 'var(--color-primary)', dot: CHART_PALETTE.secondary },
  report_purchased:  { bg: 'var(--color-primary-soft)',  text: 'var(--color-primary)', dot: CHART_PALETTE.secondary },
  hospital_selected: { bg: 'var(--color-success-soft)',  text: 'var(--color-success)', dot: CHART_PALETTE.positive },
  service_purchased: { bg: 'var(--color-success-soft)',  text: 'var(--color-success)', dot: CHART_PALETTE.positive },
  completed:         { bg: 'var(--color-success-soft)',  text: 'var(--color-success)', dot: CHART_PALETTE.positive },
};

/** 부위 배지 — 모두 info 토큰으로 통일 (구분은 텍스트 자체로). */
const AREA_BADGE: { bg: string; text: string } = {
  bg: 'var(--color-info-soft)',
  text: 'var(--color-info)',
};

const TOOLTIP_STYLE: React.CSSProperties = {
  fontSize: "var(--text-sm)", borderRadius: 10, border: 'none',
  boxShadow: 'var(--shadow-md, 0 4px 20px rgba(0,0,0,0.1))', padding: '10px 14px',
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

function resolveDateWindow(
  range: DateRange,
  t: (k: string) => string,
  customFrom?: Date | null,
  customTo?: Date | null,
): { from: string; to: string; days: string[]; label: string } {
  const today = new Date();
  if (range === 'today') {
    const day = formatLocalDate(today);
    return { from: day, to: day, days: [day], label: t('po.dateLabelToday') };
  }
  if (range === '7d') {
    const days = recentDays(7, today);
    return { from: days[0], to: days[days.length - 1], days, label: t('po.dateLabelLast7Days') };
  }
  if (range === 'custom' && customFrom) {
    const to = customTo ?? customFrom;
    const days = daysBetween(customFrom, to);
    return { from: days[0], to: days[days.length - 1], days, label: t('po.dateLabelCustom') };
  }
  const days = recentDays(30, today);
  return { from: days[0], to: days[days.length - 1], days, label: t('po.dateLabelLast30Days') };
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
      boxShadow: 'var(--app-shadow)',
      display: 'flex', alignItems: 'center', gap: 14,
      border: '1px solid var(--border-subdued)',
      transition: 'box-shadow 200ms, transform 200ms',
    }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = 'var(--app-shadow-hover)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = 'var(--app-shadow)'; e.currentTarget.style.transform = 'translateY(0)'; }}
    >
      <div style={{
        width: 36, height: 36, borderRadius: 9, background: iconBg,
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>{icon}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: "var(--text-xs)", fontWeight: "var(--font-medium)", color: 'var(--text-disabled)', letterSpacing: '0.02em' }}>{label}</div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 2 }}>
          <span style={{ fontSize: "var(--text-xl)", fontWeight: "var(--font-bold)", color: 'var(--text-default)', letterSpacing: '-0.02em', lineHeight: 1 }}>{value}</span>
          {sub && <span style={{ fontSize: "var(--text-xs)", color: 'var(--text-disabled)' }}>{sub}</span>}
        </div>
      </div>
      {trend && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 3, flexShrink: 0,
          fontSize: "var(--text-xs)", fontWeight: "var(--font-semibold)",
          color: trendUp ? 'var(--color-success)' : 'var(--color-danger)',
          background: trendUp ? 'var(--color-success-soft)' : 'var(--color-danger-soft)',
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
      boxShadow: 'var(--app-shadow)',
      border: '1px solid var(--border-subdued)',
      display: 'flex', flexDirection: 'column',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: "var(--text-md)", fontWeight: "var(--font-bold)", color: 'var(--text-default)' }}>{title}</div>
          {subtitle && <div style={{ fontSize: "var(--text-sm)", color: 'var(--text-disabled)', marginTop: 2 }}>{subtitle}</div>}
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
      <text x={cx} y={cy - 6} textAnchor="middle" style={{ fontSize: "var(--text-xl)", fontWeight: "var(--font-bold)", fill: 'var(--text-default)' }}>{total}</text>
      <text x={cx} y={cy + 14} textAnchor="middle" style={{ fontSize: "var(--text-xs)", fontWeight: "var(--font-medium)", fill: 'var(--text-disabled)' }}>{label}</text>
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
                  style={{ fontSize: "var(--text-base)", fontWeight: "var(--font-bold)", fill: '#fff', pointerEvents: 'none' }}>{r.name}</text>
                <text x={r.x + r.w / 2} y={r.h / 2 + 6} textAnchor="middle"
                  style={{ fontSize: "var(--text-xl)", fontWeight: "var(--font-bold)", fill: '#fff', pointerEvents: 'none' }}>{r.value}</text>
                <text x={r.x + r.w / 2} y={r.h / 2 + 24} textAnchor="middle"
                  style={{ fontSize: "var(--text-xs)", fontWeight: "var(--font-medium)", fill: 'rgba(255,255,255,0.7)', pointerEvents: 'none' }}>{r.pct}%</text>
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
          <span style={{ fontSize: "var(--text-sm)", color: 'var(--text-subdued)' }}>{entry.value}</span>
          <span style={{ fontSize: "var(--text-sm)", fontWeight: "var(--font-semibold)", color: 'var(--text-default)' }}>{entry.payload?.value}</span>
        </div>
      ))}
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// 메인
// ════════════════════════════════════════════════════════════
export default function DashboardPage() {
  // 크레딧 = real BE. 잔액 + 거래 이력 (RQ — 다른 페이지와 cache 공유).
  const balanceQ = useCreditBalance();
  const transactionsQ = useCreditTransactions();
  const balance = balanceQ.data?.balance ?? 0;
  const transactions = transactionsQ.data?.transactions ?? [];
  const showToast = useToastStore(s => s.showToast);
  const t = useLocaleStore(s => s.t);
  const dateFilterLabels = useDateFilterLabels();

  const [dateRange, setDateRange] = useState<DateRange>('7d');
  const [customFrom, setCustomFrom] = useState<Date | null>(null);
  const [customTo, setCustomTo] = useState<Date | null>(null);

  // React Query — /concerns, /proposals, /activity 와 cache 공유.
  const concernsQ = useConcerns();
  const proposalsQ = useMyProposals();
  const loading = concernsQ.isLoading || proposalsQ.isLoading;
  const isError = concernsQ.isError || proposalsQ.isError;
  const errorObj = concernsQ.error || proposalsQ.error;

  useEffect(() => {
    if (isError && errorObj) {
      const msg = toUserMessage(errorObj, t('po.dashboardLoadError'), t);
      showToast(msg, 'error');
    }
  }, [isError, errorObj, showToast]);

  const concerns = concernsQ.data?.concerns ?? [];
  const proposals = proposalsQ.data?.proposals ?? [];

  const refetchAll = () => {
    void concernsQ.refetch();
    void proposalsQ.refetch();
  };

  const dateWindow = resolveDateWindow(dateRange, t, customFrom, customTo);
  const periodConcerns = concerns.filter(c => isDateInWindow(c.createdAt, dateWindow.from, dateWindow.to));
  const periodProposals = proposals.filter(p => isDateInWindow(p.sentAt ?? p.createdAt, dateWindow.from, dateWindow.to));
  const periodTransactions = transactions.filter(tx => isDateInWindow(tx.createdAt, dateWindow.from, dateWindow.to));

  // KPI — BE ConcernStatus enum: draft|submitted|closed. partner 매칭 시장은 SUBMITTED 만 노출.
  const openConcerns = periodConcerns.filter(c => c.status === 'submitted');
  const myProposals = periodProposals;
  const viewedCount = myProposals.filter(p => p.viewedAt !== null).length;
  const viewRate = myProposals.length > 0 ? Math.round((viewedCount / myProposals.length) * 100) : 0;
  const selectedCount = myProposals.filter(p => isProposalAccepted({ status: p.status as ProposalStatus })).length;
  const selectedRate = myProposals.length > 0 ? Math.round((selectedCount / myProposals.length) * 100) : 0;

  // 도넛 — 제안서 상태. label 은 활성 locale 의 t() 매핑 (po.proposalStatus.<enum>).
  const statusGroups = myProposals.reduce<Record<string, number>>((acc, p) => {
    acc[p.status] = (acc[p.status] ?? 0) + 1; return acc;
  }, {});
  const pieData = Object.entries(statusGroups).map(([status, count]) => ({
    name: t(`po.proposalStatus.${status}`) || status,
    value: count,
    color: PROPOSAL_HEX[status] ?? CHART_PALETTE.neutral,
  }));

  // 도넛 — 부위별 분포
  const areaGroups = periodConcerns.reduce<Record<string, number>>((acc, c) => {
    acc[c.primaryArea] = (acc[c.primaryArea] ?? 0) + 1; return acc;
  }, {});
  const areaPieData = Object.entries(areaGroups).map(([area, count]) => ({
    // BodyArea enum key → viewerLocale 라벨 매핑 (Stage 3).
    name: t(`common.bodyArea.${area}`) || area,
    value: count,
    color: AREA_CHART_HEX[area] ?? CHART_PALETTE.neutral,
  }));

  // 기간별 제안 추이 — dataKey 는 영문 enum (recharts Tooltip/Legend 의 name prop 으로 t() 매핑).
  const days = dateWindow.days;
  const trendData = days.map(date => {
    const sent = myProposals.filter(p => p.sentAt?.slice(0, 10) === date).length;
    const viewed = myProposals.filter(p => p.viewedAt?.slice(0, 10) === date).length;
    return { date: shortDate(date), sent, viewed };
  });

  // 크레딧 일별 집계 — 동일 패턴.
  const creditDailyData = days.map(date => {
    const txs = periodTransactions.filter(tx => tx.createdAt.slice(0, 10) === date);
    const charge = txs.filter(tx => tx.amount > 0).reduce((sum, tx) => sum + tx.amount, 0);
    const spend = txs.filter(tx => tx.amount < 0).reduce((sum, tx) => sum + Math.abs(tx.amount), 0);
    return { name: shortDate(date), charge, spend, net: charge - spend };
  });
  const hasCreditDailyData = creditDailyData.some(d => d.charge > 0 || d.spend > 0);

  // ── 로딩 ──
  if (loading) {
    return (
      <AdminPage sidebar={<POSidebar active="/dashboard" />} title={t('po.dashboardTitle')} prefix="po">
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
  if (isError && !concernsQ.data && !proposalsQ.data) {
    return (
      <AdminPage sidebar={<POSidebar active="/dashboard" />} title={t('po.dashboardTitle')} prefix="po">
        <Card padding="md">
          <div className="text-center py-10">
            <AlertTriangle size={28} className="mx-auto mb-2 text-[var(--color-danger)]" />
            <p className="text-[var(--text-sm)] font-medium text-[var(--text-default)] mb-1">
              {t('po.dashboardLoadError')}
            </p>
            <p className="text-[var(--text-xs)] text-[var(--text-disabled)] mb-4">
              {toUserMessage(errorObj, t('po.unknownError'), t)}
            </p>
            <Button variant="secondary" size="sm" onClick={refetchAll}>
              {t('common.retry')}
            </Button>
          </div>
        </Card>
      </AdminPage>
    );
  }

  return (
    <AdminPage sidebar={<POSidebar active="/dashboard" />} title={t('po.dashboardTitle')} prefix="po">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* ═══ 기간 필터 ═══ */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h2 style={{ fontSize: "var(--text-lg)", fontWeight: "var(--font-bold)", color: 'var(--text-default)', margin: 0 }}>{t('po.operationStatus')}</h2>
            <p style={{ fontSize: "var(--text-sm)", color: 'var(--text-disabled)', marginTop: 2 }}>
              {t('po.basedOn', { label: dateWindow.label })}
            </p>
          </div>
          <DateFilter
            value={dateRange}
            labels={dateFilterLabels}
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
            icon={<Sparkles size={20} color={CHART_PALETTE.primary} />}
            iconBg="var(--color-info-soft)"
            label={t('po.kpiNewConcerns')}
            value={openConcerns.length}
            sub={t('po.kpiNewConcernsSub')}
            trend="+2" trendUp
          />
          <KPICard
            icon={<FileText size={20} color={CHART_PALETTE.secondary} />}
            iconBg="var(--color-primary-soft)"
            label={t('po.kpiSentProposals')}
            value={myProposals.length}
            sub={`${viewRate}%`}
            trend={`${viewRate}%`} trendUp={viewRate > 50}
          />
          <KPICard
            icon={<CheckCircle2 size={20} color="var(--color-success)" />}
            iconBg="var(--color-success-soft)"
            label={t('po.kpiSelectionRate')}
            value={`${selectedRate}%`}
            sub={`${selectedCount}`}
            trend={selectedRate > 0 ? `${selectedRate}%` : undefined}
            trendUp={selectedRate > 30}
          />
          <KPICard
            icon={<Coins size={20} color="var(--color-warning)" />}
            iconBg="var(--color-warning-soft)"
            label={t('po.kpiCreditBalance')}
            value={balance}
            sub={t('po.kpiCanSendCount', { count: Math.floor(balance / 3) })}
          />
        </div>

        {/* ═══ 차트 1행: 제안서 현황(도넛) + 주간 제안 추이(에어리어) ═══ */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <ChartCard title={t('po.chartProposalStatus')} subtitle={t('po.totalCount', { count: myProposals.length })}>
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="44%" innerRadius={62} outerRadius={85} paddingAngle={3} dataKey="value" stroke="none" cornerRadius={4}>
                    {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(value, name) => [t('po.chartUnitCount', { count: Number(value) }), String(name)]} />
                  <Legend content={<CustomLegend />} />
                  <text x="50%" y="42%" textAnchor="middle" style={{ fontSize: "var(--text-2xl)", fontWeight: "var(--font-bold)", fill: 'var(--text-default)' }}>{myProposals.length}</text>
                  <text x="50%" y="50%" textAnchor="middle" style={{ fontSize: "var(--text-xs)", fontWeight: "var(--font-medium)", fill: 'var(--text-disabled)' }}>{t('po.dashboardTotalProposals')}</text>
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 240, color: 'var(--text-disabled)', fontSize: "var(--text-sm)" }}>
                {t('po.chartProposalEmpty')}
              </div>
            )}
          </ChartCard>

          <ChartCard title={t('po.chartProposalTrend')} subtitle={dateWindow.label}>
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={trendData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradSent" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={CHART_PALETTE.primary} stopOpacity={0.12} />
                    <stop offset="100%" stopColor={CHART_PALETTE.primary} stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradViewed" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={CHART_PALETTE.positive} stopOpacity={0.12} />
                    <stop offset="100%" stopColor={CHART_PALETTE.positive} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subdued)" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: "var(--text-xs)", fill: 'var(--text-disabled)' }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: "var(--text-xs)", fill: 'var(--text-disabled)' }} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Area type="monotone" dataKey="sent" name={t('po.chartLegendSent')} stroke={CHART_PALETTE.primary} strokeWidth={2} fill="url(#gradSent)" dot={{ r: 3, fill: CHART_PALETTE.primary, strokeWidth: 0 }} activeDot={{ r: 5, fill: CHART_PALETTE.primary, stroke: '#fff', strokeWidth: 2 }} />
                <Area type="monotone" dataKey="viewed" name={t('po.chartLegendViewed')} stroke={CHART_PALETTE.positive} strokeWidth={2} fill="url(#gradViewed)" dot={{ r: 3, fill: CHART_PALETTE.positive, strokeWidth: 0 }} activeDot={{ r: 5, fill: CHART_PALETTE.positive, stroke: '#fff', strokeWidth: 2 }} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: "var(--text-sm)", paddingTop: 8 }}
                  formatter={(value: string) => <span style={{ fontSize: "var(--text-sm)", color: 'var(--text-subdued)', marginLeft: 2 }}>{value}</span>}
                />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {/* ═══ 차트 2행: 부위별 고민 분포(바) + 크레딧 내역(바) ═══ */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <ChartCard title={t('po.chartConcernByArea')} subtitle={t('po.totalCount', { count: periodConcerns.length })}>
            {areaPieData.length > 0 ? (
              <AreaTreemap data={areaPieData} total={periodConcerns.length} />
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 220, color: 'var(--text-disabled)', fontSize: "var(--text-sm)" }}>
                {t('po.chartConcernEmpty')}
              </div>
            )}
          </ChartCard>

          <ChartCard title={t('po.chartCredits')} subtitle={t('po.dailyAggregation', { label: dateWindow.label })}>
            {hasCreditDailyData ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={creditDailyData} margin={{ top: 8, right: 4, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subdued)" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: "var(--text-xs)", fill: 'var(--text-disabled)' }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: "var(--text-xs)", fill: 'var(--text-disabled)' }} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: 'rgba(79,70,229,0.04)' }}
                    formatter={(value, name) => [t('po.chartUnitCredit', { count: Number(value) }), String(name)]}
                  />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: "var(--text-sm)", paddingTop: 8 }}
                    formatter={(value: string) => <span style={{ fontSize: "var(--text-sm)", color: 'var(--text-subdued)', marginLeft: 2 }}>{value}</span>}
                  />
                  <Bar dataKey="charge" name={t('po.chartLegendCharge')} fill={CHART_PALETTE.primary} fillOpacity={0.85} radius={[6, 6, 0, 0]} maxBarSize={28} />
                  <Bar dataKey="spend" name={t('po.chartLegendSpend')} fill={CHART_PALETTE.negative} fillOpacity={0.82} radius={[6, 6, 0, 0]} maxBarSize={28} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 220, color: 'var(--text-disabled)', fontSize: "var(--text-sm)" }}>
                거래 내역이 없습니다.
              </div>
            )}
          </ChartCard>
        </div>

        {/* ═══ 최근 고민 테이블 ═══ */}
        <div style={{
          background: 'var(--surface-default)', borderRadius: 16, overflow: 'hidden',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.02)',
          border: '1px solid var(--border-subdued)',
        }}>
          {/* 헤더 */}
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '18px 24px',
          }}>
            <div>
              <div style={{ fontSize: "var(--text-md)", fontWeight: "var(--font-bold)", color: 'var(--text-default)' }}>{t('po.dashboardRecentConcerns')}</div>
              <div style={{ fontSize: "var(--text-sm)", color: 'var(--text-disabled)', marginTop: 2 }}>{t('po.dashboardOpenConcernsCount', { count: openConcerns.length })}</div>
            </div>
            <Link href="/concerns" style={{
              display: 'inline-flex', alignItems: 'center', gap: 4,
              fontSize: "var(--text-sm)", fontWeight: "var(--font-medium)", color: CHART_PALETTE.primary, textDecoration: 'none',
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
                {[
                  t('po.tableHeaderArea'),
                  t('po.tableHeaderBudget'),
                  t('po.tableHeaderVisit'),
                  t('po.tableHeaderStatus'),
                  '',
                ].map((h, i) => (
                  <th key={i} style={{
                    padding: '10px 24px', fontSize: "var(--text-xs)", fontWeight: "var(--font-semibold)", color: 'var(--text-disabled)',
                    textAlign: 'left', letterSpacing: '0.05em', textTransform: 'uppercase' as const,
                    borderTop: '1px solid var(--border-subdued)', borderBottom: '1px solid var(--border-subdued)',
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {openConcerns.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-disabled)', padding: '40px 0', fontSize: "var(--text-sm)" }}>
                    {t('po.tableEmpty')}
                  </td>
                </tr>
              )}
              {openConcerns.slice(0, 5).map(c => {
                const statusKey = CONCERN_STATUS_I18N_KEY[c.status];
                const statusLabel = statusKey ? t(statusKey) : c.status;
                const statusStyle = CONCERN_STATUS_BADGE[c.status] ?? {
                  bg: 'var(--surface-subdued)', text: 'var(--text-subdued)', dot: CHART_PALETTE.neutral,
                };
                const areaStyle = AREA_BADGE;

                return (
                  <tr key={c.id} style={{ borderBottom: '1px solid #f8fafc', transition: 'background 150ms', cursor: 'pointer' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-hovered)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <td style={{ padding: '14px 24px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{
                          display: 'inline-block', padding: '3px 10px', borderRadius: 6,
                          fontSize: "var(--text-sm)", fontWeight: "var(--font-semibold)", background: areaStyle.bg, color: areaStyle.text,
                        }}>{t(`common.bodyArea.${c.primaryArea}`)}</span>
                        {c.bodyAreaDetail && <span style={{ fontSize: "var(--text-sm)", color: 'var(--text-subdued)' }}>{c.bodyAreaDetail}</span>}
                      </div>
                    </td>
                    <td style={{ padding: '14px 24px', fontSize: "var(--text-sm)", color: 'var(--text-default)', fontVariantNumeric: 'tabular-nums' }}>
                      {(c.budgetMin == null && c.budgetMax == null) ? '-' : `${formatBudget(c.budgetMin, c.budgetMax)}${t('common.man')}`}
                    </td>
                    <td style={{ padding: '14px 24px', fontSize: "var(--text-sm)", color: 'var(--text-subdued)' }}>
                      {c.visitDateFrom ? formatDateRange(c.visitDateFrom, c.visitDateTo) : t('common.tbd')}
                    </td>
                    <td style={{ padding: '14px 24px' }}>
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: 5,
                        padding: '3px 10px', borderRadius: 20, fontSize: "var(--text-sm)", fontWeight: "var(--font-medium)",
                        background: statusStyle.bg, color: statusStyle.text,
                      }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: statusStyle.dot }} />
                        {statusLabel}
                      </span>
                    </td>
                    <td style={{ padding: '14px 24px' }}>
                      <Link href={`/concerns/${c.id}`} style={{
                        fontSize: "var(--text-sm)", fontWeight: "var(--font-medium)", color: CHART_PALETTE.primary, textDecoration: 'none',
                      }}>{t('po.tableView')}</Link>
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

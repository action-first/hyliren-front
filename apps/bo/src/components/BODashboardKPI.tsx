'use client';

import { Users, Building2, FileText, Eye, Banknote, TrendingUp, TrendingDown } from 'lucide-react';

const C = {
  main: '#4F46E5',
  sub: '#8B5CF6',
  positive: '#10B981',
  negative: '#F43F5E',
};

function KPICard({ icon, iconBg, label, value, sub, trend, trendUp }: {
  icon: React.ReactNode; iconBg: string;
  label: string; value: string | number; sub?: string;
  trend?: string; trendUp?: boolean;
}) {
  return (
    <div style={{
      background: '#fff', borderRadius: 16, padding: '16px 18px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
      border: '1px solid #f1f5f9',
      transition: 'box-shadow 200ms, transform 200ms',
    }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.07)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.04)'; e.currentTarget.style.transform = 'translateY(0)'; }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <div style={{
          width: 34, height: 34, borderRadius: 9, background: iconBg,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>{icon}</div>
        {trend && (
          <span style={{
            fontSize: 11, fontWeight: 600,
            color: trendUp ? C.positive : C.negative,
            background: trendUp ? '#ecfdf5' : '#fff1f2',
            padding: '2px 7px', borderRadius: 20,
            display: 'inline-flex', alignItems: 'center', gap: 2,
          }}>
            {trendUp ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
            {trend}
          </span>
        )}
      </div>
      <div style={{ fontSize: 11, fontWeight: 500, color: '#94a3b8', marginBottom: 3 }}>{label}</div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
        <span style={{ fontSize: 22, fontWeight: 700, color: '#0f172a', letterSpacing: '-0.02em', lineHeight: 1 }}>{value}</span>
        {sub && <span style={{ fontSize: 11, color: '#94a3b8' }}>{sub}</span>}
      </div>
    </div>
  );
}

export function BODashboardKPI({
  buyerCount, partnerCount, concernCount, proposalCount,
  totalRevenue, viewRate, selectRate,
}: {
  buyerCount: number; partnerCount: number;
  concernCount: number; proposalCount: number;
  totalRevenue: number; viewRate: number; selectRate: number;
}) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 14 }}>
      <KPICard
        icon={<Users size={16} color={C.main} />}
        iconBg="#EEF2FF"
        label="총 고객"
        value={buyerCount}
        sub="명"
      />
      <KPICard
        icon={<Building2 size={16} color={C.sub} />}
        iconBg="#F5F3FF"
        label="파트너 병원"
        value={partnerCount}
        sub="곳"
      />
      <KPICard
        icon={<FileText size={16} color={C.main} />}
        iconBg="#EEF2FF"
        label="고민 · 제안서"
        value={concernCount}
        sub={`/ ${proposalCount}`}
      />
      <KPICard
        icon={<Eye size={16} color={C.sub} />}
        iconBg="#F5F3FF"
        label="열람률 · 선택률"
        value={`${viewRate}%`}
        sub={`· ${selectRate}%`}
        trend={selectRate > 0 ? `${selectRate}%` : undefined}
        trendUp={selectRate > 30}
      />
      <KPICard
        icon={<Banknote size={16} color={C.positive} />}
        iconBg="#ECFDF5"
        label="총 결제"
        value={`₩${(totalRevenue / 10000).toFixed(1)}만`}
        trend="+18%" trendUp
      />
    </div>
  );
}

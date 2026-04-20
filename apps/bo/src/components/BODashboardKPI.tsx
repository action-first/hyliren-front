'use client';

import { Users, Building2, FileText, Banknote, TrendingUp, TrendingDown } from 'lucide-react';

function KPICard({ icon, iconBg, label, value, sub, trend, trendUp }: {
  icon: React.ReactNode; iconBg: string;
  label: string; value: string | number; sub?: string;
  trend?: string; trendUp?: boolean;
}) {
  return (
    <div style={{
      background: '#fff', borderRadius: 14, padding: '16px 20px',
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
        <div style={{ fontSize: 11, fontWeight: 500, color: '#94a3b8', letterSpacing: '0.02em' }}>{label}</div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 2 }}>
          <span style={{ fontSize: 22, fontWeight: 700, color: '#0f172a', letterSpacing: '-0.02em', lineHeight: 1 }}>{value}</span>
          {sub && <span style={{ fontSize: 11, color: '#94a3b8' }}>{sub}</span>}
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

export function BODashboardKPI({
  buyerCount, partnerCount, concernCount, proposalCount,
  totalRevenue, viewRate, selectRate,
}: {
  buyerCount: number; partnerCount: number;
  concernCount: number; proposalCount: number;
  totalRevenue: number; viewRate: number; selectRate: number;
}) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
      <KPICard
        icon={<Users size={18} color="#18181b" />}
        iconBg="#f4f4f5"
        label="총 고객"
        value={buyerCount}
        sub="명"
      />
      <KPICard
        icon={<Building2 size={18} color="#3f3f46" />}
        iconBg="#f4f4f5"
        label="파트너 병원"
        value={partnerCount}
        sub="곳"
      />
      <KPICard
        icon={<FileText size={18} color="#52525b" />}
        iconBg="#f4f4f5"
        label="고민 / 제안서"
        value={`${concernCount} / ${proposalCount}`}
        sub={`열람률 ${viewRate}%`}
        trend={`${selectRate}%`}
        trendUp={selectRate > 30}
      />
      <KPICard
        icon={<Banknote size={18} color="#18181b" />}
        iconBg="#f4f4f5"
        label="총 결제"
        value={`₩${totalRevenue.toLocaleString()}`}
      />
    </div>
  );
}

'use client';

import { useRef, useState, useEffect } from 'react';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  AreaChart, Area,
} from 'recharts';

const TOOLTIP_STYLE: React.CSSProperties = {
  fontSize: 13, borderRadius: 10, border: 'none',
  boxShadow: '0 4px 20px rgba(0,0,0,0.1)', padding: '10px 14px',
  background: '#fff',
};

// ── 커스텀 범례 ──
function CustomLegend({ payload }: { payload?: Array<{ value: string; color: string; payload?: { value: number } }> }) {
  if (!payload) return null;
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 16px', justifyContent: 'center', marginTop: 8 }}>
      {payload.map((entry, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: entry.color, flexShrink: 0 }} />
          <span style={{ fontSize: 12, color: '#64748b' }}>{entry.value}</span>
          <span style={{ fontSize: 12, fontWeight: 600, color: '#334155' }}>{entry.payload?.value}</span>
        </div>
      ))}
    </div>
  );
}

// ── 고민 상태 도넛 ──
const STATUS_HEX: Record<string, string> = {
  submitted: '#f59e0b',
  proposal_received: '#3b82f6',
  comparing: '#6366f1',
  hospital_selected: '#10b981',
  completed: '#94a3b8',
};

export function ConcernStatusPie({ data, total }: { data: { name: string; value: number; status: string }[]; total?: number }) {
  if (data.every(d => d.value === 0)) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 240, color: '#94a3b8', fontSize: 13 }}>데이터 없음</div>;
  const sum = total ?? data.reduce((s, d) => s + d.value, 0);
  return (
    <ResponsiveContainer width="100%" height={240}>
      <PieChart>
        <Pie data={data} cx="50%" cy="44%" innerRadius={62} outerRadius={85} paddingAngle={3} dataKey="value" stroke="none" cornerRadius={4}>
          {data.map(entry => <Cell key={entry.status} fill={STATUS_HEX[entry.status] || '#94a3b8'} />)}
        </Pie>
        <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(value, name) => [`${Number(value)}건`, String(name)]} />
        <Legend content={<CustomLegend />} />
        <text x="50%" y="42%" textAnchor="middle" style={{ fontSize: 24, fontWeight: 700, fill: '#0f172a' }}>{sum}</text>
        <text x="50%" y="50%" textAnchor="middle" style={{ fontSize: 11, fontWeight: 500, fill: '#94a3b8' }}>총 고민</text>
      </PieChart>
    </ResponsiveContainer>
  );
}

// ── 제안서 현황 바차트 ──
const PROPOSAL_HEX: Record<string, string> = {
  sent: '#94a3b8', viewed: '#f59e0b', shortlisted: '#3b82f6', selected: '#10b981', rejected: '#ef4444',
};

export function ProposalStatusBar({ data }: { data: { name: string; value: number; status: string }[] }) {
  if (data.every(d => d.value === 0)) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 220, color: '#94a3b8', fontSize: 13 }}>데이터 없음</div>;
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 8, right: 4, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
        <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
        <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
        <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: 'rgba(0,0,0,0.02)' }} formatter={(value) => [`${Number(value)}건`]} />
        <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={32}>
          {data.map(entry => <Cell key={entry.status} fill={PROPOSAL_HEX[entry.status] || '#94a3b8'} fillOpacity={0.85} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

// ── 전환 퍼널 ──
export function ConversionFunnel({ data }: { data: { label: string; value: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <AreaChart data={data} margin={{ top: 8, right: 16, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="boFunnelGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#18181b" stopOpacity={0.1} />
            <stop offset="100%" stopColor="#18181b" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
        <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#64748b' }} tickLine={false} axisLine={false} />
        <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
        <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(value) => [`${Number(value)}건`]} />
        <Area type="monotone" dataKey="value" stroke="#18181b" fill="url(#boFunnelGrad)" strokeWidth={2}
          dot={{ r: 4, fill: '#18181b', strokeWidth: 0 }}
          activeDot={{ r: 6, fill: '#18181b', stroke: '#fff', strokeWidth: 2 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

// ── 부위별 고민 트리맵 ──
const AREA_HEX: Record<string, string> = {
  '눈': '#6366f1', '코': '#ec4899', '리프팅': '#8b5cf6', '피부': '#10b981', '다이어트': '#f59e0b', '기타': '#94a3b8',
};

export function BodyAreaTreemap({ data, total }: { data: { name: string; value: number }[]; total: number }) {
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

  if (data.every(d => d.value === 0)) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200, color: '#94a3b8', fontSize: 13 }}>데이터 없음</div>;

  const rects: { x: number; y: number; w: number; h: number; name: string; value: number; color: string; pct: number }[] = [];
  let x = 0;
  const gap = 4;
  sorted.forEach(d => {
    const ratio = d.value / sum;
    const w = Math.max(ratio * size.w - gap, 0);
    rects.push({ x: x + gap / 2, y: 0, w, h: size.h, name: d.name, value: d.value, color: AREA_HEX[d.name] || '#94a3b8', pct: total > 0 ? Math.round((d.value / total) * 100) : 0 });
    x += ratio * size.w;
  });

  return (
    <div ref={containerRef} style={{ width: '100%', height: 200 }}>
      <svg width={size.w} height={size.h}>
        {rects.map((r, i) => (
          <g key={i}>
            <rect x={r.x} y={r.y} width={r.w} height={r.h} rx={10} ry={10}
              fill={r.color} fillOpacity={0.78}
              style={{ transition: 'fill-opacity 200ms', cursor: 'pointer' }}
              onMouseEnter={e => { e.currentTarget.style.fillOpacity = '1'; }}
              onMouseLeave={e => { e.currentTarget.style.fillOpacity = '0.78'; }}
            />
            {r.w > 44 && r.h > 50 && (
              <>
                <text x={r.x + r.w / 2} y={r.h / 2 - 14} textAnchor="middle" style={{ fontSize: 14, fontWeight: 700, fill: '#fff', pointerEvents: 'none' }}>{r.name}</text>
                <text x={r.x + r.w / 2} y={r.h / 2 + 6} textAnchor="middle" style={{ fontSize: 20, fontWeight: 800, fill: '#fff', pointerEvents: 'none' }}>{r.value}</text>
                <text x={r.x + r.w / 2} y={r.h / 2 + 24} textAnchor="middle" style={{ fontSize: 11, fontWeight: 500, fill: 'rgba(255,255,255,0.7)', pointerEvents: 'none' }}>{r.pct}%</text>
              </>
            )}
          </g>
        ))}
      </svg>
    </div>
  );
}

// ── 이전 호환용 (BodyAreaBar 사용처가 없어야 하지만 안전 보장) ──
export function BodyAreaBar({ data }: { data: { name: string; value: number }[] }) {
  return <BodyAreaTreemap data={data} total={data.reduce((s, d) => s + d.value, 0)} />;
}

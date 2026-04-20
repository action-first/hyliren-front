'use client';

import { useRef, useState, useEffect } from 'react';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  AreaChart, Area,
} from 'recharts';

// ══════════════════════════════════════
// 컬러 팔레트 시스템
// ══════════════════════════════════════
const C = {
  main: '#4F46E5',       // 인디고 블루
  sub: '#8B5CF6',        // 바이올렛
  positive: '#10B981',   // 에메랄드 그린
  negative: '#F43F5E',   // 로즈 핑크
  neutral: '#94A3B8',    // 슬레이트 그레이
  neutralLight: '#CBD5E1',
  text: '#0f172a',
  textSub: '#64748b',
};

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
          <span style={{ fontSize: 12, color: C.textSub }}>{entry.value}</span>
          <span style={{ fontSize: 12, fontWeight: 600, color: C.text }}>{entry.payload?.value}</span>
        </div>
      ))}
    </div>
  );
}

// ══════════════════════════════════════
// 고민 상태 도넛 — 시맨틱 컬러 매핑
// ══════════════════════════════════════
const STATUS_HEX: Record<string, string> = {
  submitted: C.neutralLight,           // 대기 — 그레이
  proposal_received: C.main,           // 제안 도착 — 인디고
  comparing: C.sub,                    // 비교 중 — 바이올렛
  hospital_selected: C.positive,       // 병원 선택 — 에메랄드
  completed: C.neutral,                // 완료 — 슬레이트
};

export function ConcernStatusPie({ data, total }: { data: { name: string; value: number; status: string }[]; total?: number }) {
  if (data.every(d => d.value === 0)) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 240, color: C.neutral, fontSize: 13 }}>데이터 없음</div>;
  const sum = total ?? data.reduce((s, d) => s + d.value, 0);
  return (
    <ResponsiveContainer width="100%" height={240}>
      <PieChart>
        <Pie data={data} cx="50%" cy="44%" innerRadius={65} outerRadius={84} paddingAngle={3} dataKey="value" stroke="none" cornerRadius={4}>
          {data.map(entry => <Cell key={entry.status} fill={STATUS_HEX[entry.status] || C.neutral} />)}
        </Pie>
        <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(value, name) => [`${Number(value)}건`, String(name)]} />
        <Legend content={<CustomLegend />} />
        <text x="50%" y="42%" textAnchor="middle" style={{ fontSize: 26, fontWeight: 700, fill: C.text }}>{sum}</text>
        <text x="50%" y="50%" textAnchor="middle" style={{ fontSize: 11, fontWeight: 500, fill: C.neutral }}>총 고민</text>
      </PieChart>
    </ResponsiveContainer>
  );
}

// ══════════════════════════════════════
// 제안서 현황 바차트 — 시맨틱 컬러
// ══════════════════════════════════════
const PROPOSAL_HEX: Record<string, string> = {
  sent: C.neutralLight,      // 발송 — 그레이
  viewed: C.sub,             // 열람 — 바이올렛
  shortlisted: C.main,       // 후보 — 인디고
  selected: C.positive,      // 선택 — 에메랄드
  rejected: C.negative,      // 거절 — 로즈
};

export function ProposalStatusBar({ data }: { data: { name: string; value: number; status: string }[] }) {
  if (data.every(d => d.value === 0)) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 220, color: C.neutral, fontSize: 13 }}>데이터 없음</div>;
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 8, right: 4, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
        <XAxis dataKey="name" tick={{ fontSize: 11, fill: C.neutral }} tickLine={false} axisLine={false} />
        <YAxis tick={{ fontSize: 11, fill: C.neutral }} tickLine={false} axisLine={false} />
        <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: 'rgba(79,70,229,0.04)' }} formatter={(value) => [`${Number(value)}건`]} />
        <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={36}>
          {data.map(entry => <Cell key={entry.status} fill={PROPOSAL_HEX[entry.status] || C.neutral} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

// ══════════════════════════════════════
// 전환 퍼널 — 인디고 그라데이션
// ══════════════════════════════════════
export function ConversionFunnel({ data }: { data: { label: string; value: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <AreaChart data={data} margin={{ top: 8, right: 16, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="boFunnelGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={C.main} stopOpacity={0.15} />
            <stop offset="100%" stopColor={C.main} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
        <XAxis dataKey="label" tick={{ fontSize: 12, fill: C.textSub }} tickLine={false} axisLine={false} />
        <YAxis tick={{ fontSize: 11, fill: C.neutral }} tickLine={false} axisLine={false} />
        <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(value) => [`${Number(value)}건`]} />
        <Area type="monotone" dataKey="value" stroke={C.main} fill="url(#boFunnelGrad)" strokeWidth={2.5}
          dot={{ r: 4, fill: C.main, strokeWidth: 0 }}
          activeDot={{ r: 6, fill: C.main, stroke: '#fff', strokeWidth: 2 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

// ══════════════════════════════════════
// 부위별 고민 트리맵 — 인디고 + 바이올렛 조합
// ══════════════════════════════════════
const AREA_HEX: Record<string, string> = {
  '눈': C.main,
  '코': '#818CF8',         // 인디고 300
  '리프팅': C.sub,
  '피부': '#A78BFA',       // 바이올렛 300
  '다이어트': '#6366F1',   // 인디고 500
  '기타': C.neutral,
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

  if (data.every(d => d.value === 0)) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200, color: C.neutral, fontSize: 13 }}>데이터 없음</div>;

  const rects: { x: number; y: number; w: number; h: number; name: string; value: number; color: string; pct: number }[] = [];
  let x = 0;
  const gap = 4;
  sorted.forEach(d => {
    const ratio = d.value / sum;
    const w = Math.max(ratio * size.w - gap, 0);
    rects.push({ x: x + gap / 2, y: 0, w, h: size.h, name: d.name, value: d.value, color: AREA_HEX[d.name] || C.neutral, pct: total > 0 ? Math.round((d.value / total) * 100) : 0 });
    x += ratio * size.w;
  });

  return (
    <div ref={containerRef} style={{ width: '100%', height: 200 }}>
      <svg width={size.w} height={size.h}>
        {rects.map((r, i) => (
          <g key={i}>
            <rect x={r.x} y={r.y} width={r.w} height={r.h} rx={10} ry={10}
              fill={r.color} fillOpacity={0.85}
              style={{ transition: 'fill-opacity 200ms', cursor: 'pointer' }}
              onMouseEnter={e => { e.currentTarget.style.fillOpacity = '1'; }}
              onMouseLeave={e => { e.currentTarget.style.fillOpacity = '0.85'; }}
            />
            {r.w > 44 && r.h > 50 && (
              <>
                <text x={r.x + r.w / 2} y={r.h / 2 - 14} textAnchor="middle" style={{ fontSize: 14, fontWeight: 700, fill: '#fff', pointerEvents: 'none' }}>{r.name}</text>
                <text x={r.x + r.w / 2} y={r.h / 2 + 6} textAnchor="middle" style={{ fontSize: 20, fontWeight: 800, fill: '#fff', pointerEvents: 'none' }}>{r.value}</text>
                <text x={r.x + r.w / 2} y={r.h / 2 + 24} textAnchor="middle" style={{ fontSize: 11, fontWeight: 500, fill: 'rgba(255,255,255,0.75)', pointerEvents: 'none' }}>{r.pct}%</text>
              </>
            )}
          </g>
        ))}
      </svg>
    </div>
  );
}

export function BodyAreaBar({ data }: { data: { name: string; value: number }[] }) {
  return <BodyAreaTreemap data={data} total={data.reduce((s, d) => s + d.value, 0)} />;
}

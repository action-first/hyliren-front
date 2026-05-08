'use client';

import { useState } from 'react';
import { DateFilter } from '@hyliren/ui';
import type { DateRange } from '@hyliren/ui';

export function DashboardHeader() {
  const [range, setRange] = useState<DateRange>('30d');

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
      <div>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-default)', margin: 0 }}>운영 현황</h2>
        <p style={{ fontSize: 13, color: 'var(--text-disabled)', marginTop: 2 }}>
          {range === 'today' ? '오늘' : range === '7d' ? '최근 7일' : range === '30d' ? '최근 30일' : '사용자 지정 기간'} 기준
        </p>
      </div>
      <DateFilter value={range} onChange={setRange} />
    </div>
  );
}

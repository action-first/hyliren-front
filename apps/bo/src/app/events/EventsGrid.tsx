'use client';

import { DataGrid, dotTextRenderer } from '@hyliren/ui';
import type { SearchField } from '@hyliren/ui';
import type { ColDef } from 'ag-grid-community';

interface EventRow {
  id: string;
  timestamp: string;
  eventType: string;
  actorType: string;
  target: string;
  meta: string;
}

const EVENT_TYPE_DOT: Record<string, string> = {
  page_view: '#94a3b8', concern_submit: '#10b981',
  proposal_send: '#3b82f6', proposal_view: '#f59e0b',
  report_purchase: '#ec4899',
};

const ACTOR_DOT: Record<string, string> = {
  user: '#3b82f6', partner: '#8b5cf6', system: '#94a3b8',
};

const searchFields: SearchField[] = [
  { key: 'timestamp', label: '기간', type: 'dateRange', row: 1 },
  { key: 'eventType', label: '이벤트', type: 'select', row: 1, options: [
    { value: 'page_view', label: 'page_view' },
    { value: 'concern_submit', label: 'concern_submit' },
    { value: 'proposal_send', label: 'proposal_send' },
    { value: 'proposal_view', label: 'proposal_view' },
  ]},
  { key: 'actorType', label: '주체', type: 'select', row: 1, options: [
    { value: 'user', label: '유저' }, { value: 'partner', label: '파트너' }, { value: 'system', label: '시스템' },
  ]},
  { key: '_keyword', label: '키워드', placeholder: '이벤트, 대상, 메타 통합 검색', row: 2 },
];

const columnDefs: ColDef<EventRow>[] = [
  { field: 'timestamp', headerName: '시간', flex: 0.8, minWidth: 130, filter: false,
    cellStyle: { color: 'var(--text-disabled)', fontVariantNumeric: 'tabular-nums', fontSize: '12px' },
  },
  { field: 'eventType', headerName: '이벤트', flex: 1, minWidth: 130, filter: true,
    cellRenderer: dotTextRenderer(EVENT_TYPE_DOT),
  },
  { field: 'actorType', headerName: '주체', flex: 0.5, minWidth: 70, filter: true,
    cellRenderer: dotTextRenderer(ACTOR_DOT),
  },
  { field: 'target', headerName: '대상', flex: 0.8, minWidth: 120, filter: true,
    cellStyle: { color: 'var(--text-subdued)' },
  },
  { field: 'meta', headerName: '메타', flex: 1.2, minWidth: 150, filter: true,
    cellStyle: { color: 'var(--text-disabled)', fontSize: '12px' },
  },
];

export function EventsGrid({ rows }: { rows: EventRow[] }) {
  return (
    <DataGrid<EventRow>
      columnDefs={columnDefs}
      rowData={rows}
      searchFields={searchFields}
      exportFileName="이벤트로그"
      title="이벤트 로그"
    />
  );
}

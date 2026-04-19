'use client';

import { DataGrid, badgeCellRenderer } from '@hyliren/ui';
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

const EVENT_TYPE_BADGE: Record<string, { bg: string; text: string }> = {
  page_view:        { bg: '#f1f5f9', text: '#475569' },
  concern_submit:   { bg: '#dcfce7', text: '#166534' },
  proposal_send:    { bg: '#dbeafe', text: '#1e40af' },
  proposal_view:    { bg: '#fef9c3', text: '#854d0e' },
  report_purchase:  { bg: '#fce7f3', text: '#9d174d' },
};

const ACTOR_BADGE: Record<string, { bg: string; text: string }> = {
  user:    { bg: '#eff6ff', text: '#1d4ed8' },
  partner: { bg: '#f5f3ff', text: '#7c3aed' },
  system:  { bg: '#f1f5f9', text: '#475569' },
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
    cellStyle: { color: '#9ca3af', fontVariantNumeric: 'tabular-nums', fontSize: '12px' },
  },
  { field: 'eventType', headerName: '이벤트', flex: 1, minWidth: 130, filter: true,
    cellRenderer: badgeCellRenderer(EVENT_TYPE_BADGE),
  },
  { field: 'actorType', headerName: '주체', flex: 0.5, minWidth: 70, filter: true,
    cellRenderer: badgeCellRenderer(ACTOR_BADGE),
  },
  { field: 'target', headerName: '대상', flex: 0.8, minWidth: 120, filter: true,
    cellStyle: { color: '#6b7280' },
  },
  { field: 'meta', headerName: '메타', flex: 1.2, minWidth: 150, filter: true,
    cellStyle: { color: '#9ca3af', fontSize: '12px' },
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

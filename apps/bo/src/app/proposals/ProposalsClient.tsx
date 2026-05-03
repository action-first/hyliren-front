'use client';

import { useRouter } from 'next/navigation';
import {
  MOCK_CONCERNS, MOCK_PARTNER_PROFILES,
  PROPOSAL_STATUS_KR, PROPOSAL_STATUS_BADGE, BODY_AREA_DOT,
  formatDateKR,
} from '@hyliren/shared';
import type { Proposal } from '@hyliren/shared';
import { BOSidebar } from '@/components/BOSidebar';
import {
  DataGrid, AdminPage,
  badgeCellRenderer, dotTextRenderer, detailLinkRenderer,
} from '@hyliren/ui';
import type { SearchField } from '@hyliren/ui';
import type { ColDef } from 'ag-grid-community';

interface ProposalRow {
  id: string;
  area: string;
  hospitalName: string;
  totalPrice: string;
  /** proposal.status enum — BADGE 인덱싱용. cellRenderer 가 PROPOSAL_STATUS_KR 한국어 라벨 매핑. */
  statusEnum: string;
  sentAt: string;
}

const searchFields: SearchField[] = [
  { key: 'sentAt', label: '기간', type: 'dateRange', row: 1 },
  { key: 'area', label: '부위', type: 'select', row: 1, options: [
    { value: '눈', label: '눈' }, { value: '코', label: '코' },
    { value: '리프팅', label: '리프팅' }, { value: '피부', label: '피부' },
  ]},
  { key: 'statusEnum', label: '상태', type: 'select', row: 1, options: [
    { value: 'sent', label: '발송' }, { value: 'viewed', label: '열람' },
    { value: 'selected', label: '선택됨' }, { value: 'rejected', label: '거절' },
  ]},
  { key: '_keyword', label: '키워드', placeholder: '병원명, 부위 통합 검색', row: 2 },
];

const columnDefs: ColDef<ProposalRow>[] = [
  { field: 'area', headerName: '부위', flex: 0.5, minWidth: 70, filter: true,
    cellRenderer: dotTextRenderer(BODY_AREA_DOT),
  },
  { field: 'hospitalName', headerName: '병원', flex: 1.2, minWidth: 130, filter: true,
    cellStyle: { fontWeight: 500 },
  },
  { field: 'totalPrice', headerName: '가격', flex: 0.6, minWidth: 80, filter: false,
    cellStyle: { fontWeight: 600 },
  },
  { field: 'statusEnum', headerName: '상태', flex: 0.6, minWidth: 80, filter: true,
    cellRenderer: (p: { value: string }) => {
      if (!p.value) return null;
      const c = PROPOSAL_STATUS_BADGE[p.value] || { bg: '#f3f4f6', text: '#374151' };
      const label = PROPOSAL_STATUS_KR[p.value] || p.value;
      return (
        <span style={{
          display: 'inline-flex', alignItems: 'center', height: 22,
          padding: '0 8px', borderRadius: 4,
          fontSize: 12, fontWeight: 500, lineHeight: 1,
          background: c.bg, color: c.text,
        }}>{label}</span>
      );
    },
  },
  { field: 'sentAt', headerName: '발송일', flex: 0.7, minWidth: 90, filter: false,
    cellStyle: { color: '#9ca3af', fontVariantNumeric: 'tabular-nums' },
  },
  { headerName: '액션', flex: 0.4, minWidth: 50, sortable: false, resizable: false, filter: false,
    cellRenderer: detailLinkRenderer<ProposalRow>('/proposals', '상세', '#18181b'),
  },
];

export function ProposalsClient({ proposals }: { proposals: Proposal[] }) {
  const router = useRouter();
  const rowData: ProposalRow[] = proposals.filter(p => p.isActive).map(p => {
    const concern = MOCK_CONCERNS.find(c => c.id === p.concernId);
    const profile = MOCK_PARTNER_PROFILES.find(pp => pp.memberId === p.memberId);
    return {
      id: p.id,
      area: concern?.primaryArea || '-',
      hospitalName: profile?.hospitalName || p.memberId,
      totalPrice: `${p.totalPrice}만`,
      statusEnum: p.status,
      sentAt: formatDateKR(p.sentAt),
    };
  });

  return (
    <AdminPage sidebar={<BOSidebar active="/proposals" />} title="제안서 관리" prefix="bo">
      <DataGrid<ProposalRow>
        columnDefs={columnDefs}
        rowData={rowData}
        searchFields={searchFields}
        exportFileName="제안서목록"
        title="제안서 목록"
        onRowClick={(data) => router.push(`/proposals/${data.id}`)}
      />
    </AdminPage>
  );
}

'use client';

import { useRouter } from 'next/navigation';
import {
  MOCK_PROPOSALS, MOCK_CONCERNS, MOCK_PARTNER_PROFILES,
  PROPOSAL_STATUS_KR, PROPOSAL_STATUS_BADGE, BODY_AREA_DOT,
  formatDateKR,
} from '@hyliren/shared';
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
  statusLabel: string;
  sentAt: string;
}

const searchFields: SearchField[] = [
  { key: 'sentAt', label: '기간', type: 'dateRange', row: 1 },
  { key: 'area', label: '부위', type: 'select', row: 1, options: [
    { value: '눈', label: '눈' }, { value: '코', label: '코' },
    { value: '리프팅', label: '리프팅' }, { value: '피부', label: '피부' },
  ]},
  { key: 'statusLabel', label: '상태', type: 'select', row: 1, options: [
    { value: '발송', label: '발송' }, { value: '열람', label: '열람' },
    { value: '선택됨', label: '선택됨' }, { value: '거절', label: '거절' },
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
  { field: 'statusLabel', headerName: '상태', flex: 0.6, minWidth: 80, filter: true,
    cellRenderer: badgeCellRenderer(PROPOSAL_STATUS_BADGE),
  },
  { field: 'sentAt', headerName: '발송일', flex: 0.7, minWidth: 90, filter: false,
    cellStyle: { color: '#9ca3af', fontVariantNumeric: 'tabular-nums' },
  },
  { headerName: '액션', flex: 0.4, minWidth: 50, sortable: false, resizable: false, filter: false,
    cellRenderer: detailLinkRenderer<ProposalRow>('/proposals', '상세', '#18181b'),
  },
];

export default function ProposalsPage() {
  const router = useRouter();
  const proposals = MOCK_PROPOSALS.filter(p => p.isActive);
  const rowData: ProposalRow[] = proposals.map(p => {
    const concern = MOCK_CONCERNS.find(c => c.id === p.concernId);
    const profile = MOCK_PARTNER_PROFILES.find(pp => pp.memberId === p.memberId);
    return {
      id: p.id,
      area: concern?.primaryArea || '-',
      hospitalName: profile?.hospitalName || '-',
      totalPrice: `${p.totalPrice}만`,
      statusLabel: PROPOSAL_STATUS_KR[p.status] || p.status,
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

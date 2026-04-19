'use client';

import { useState, useEffect } from 'react';
import {
  PROPOSAL_STATUS_KR, PROPOSAL_STATUS_BADGE, BODY_AREA_BADGE,
  MOCK_PARTNER_PROFILES, formatDateKR,
} from '@hyliren/shared';
import type { Proposal, Concern } from '@hyliren/shared';
import {
  Spinner, AdminPage, DataGrid,
  badgeCellRenderer, detailLinkRenderer,
} from '@hyliren/ui';
import type { SearchField } from '@hyliren/ui';
import { POSidebar } from '@/components/POSidebar';
import { usePOAuthStore } from '@/store/po-auth';
import type { ColDef } from 'ag-grid-community';

interface ProposalRow {
  id: string;
  area: string;
  detail: string;
  hospitalName: string;
  totalPrice: string;
  status: string;
  statusLabel: string;
  sentAt: string;
  viewedAt: string;
}

const searchFields: SearchField[] = [
  { key: 'sentAt', label: '기간', type: 'dateRange', row: 1 },
  { key: 'area', label: '부위', type: 'select', row: 1, options: [
    { value: '눈', label: '눈' }, { value: '코', label: '코' },
    { value: '리프팅', label: '리프팅' }, { value: '피부', label: '피부' },
  ]},
  { key: 'statusLabel', label: '상태', type: 'select', row: 1, options: [
    { value: '발송', label: '발송' }, { value: '열람', label: '열람' },
    { value: '후보', label: '후보' }, { value: '선택됨', label: '선택됨' },
  ]},
  { key: '_keyword', label: '키워드', placeholder: '병원명, 부위 통합 검색', row: 2 },
];

const columnDefs: ColDef<ProposalRow>[] = [
  {
    field: 'area', headerName: '부위', flex: 0.5, minWidth: 70, filter: true,
    cellRenderer: badgeCellRenderer(BODY_AREA_BADGE),
  },
  { field: 'detail', headerName: '상세', flex: 0.7, minWidth: 80, filter: true },
  { field: 'totalPrice', headerName: '가격', flex: 0.6, minWidth: 80, filter: false,
    cellStyle: { fontWeight: 600 },
  },
  {
    field: 'statusLabel', headerName: '상태', flex: 0.6, minWidth: 80, filter: true,
    cellRenderer: badgeCellRenderer(PROPOSAL_STATUS_BADGE),
  },
  { field: 'sentAt', headerName: '발송일', flex: 0.7, minWidth: 90, filter: false,
    cellStyle: { color: '#9ca3af', fontVariantNumeric: 'tabular-nums' },
  },
  { field: 'viewedAt', headerName: '열람일', flex: 0.7, minWidth: 90, filter: false,
    cellStyle: { color: '#9ca3af', fontVariantNumeric: 'tabular-nums' },
  },
  {
    headerName: '액션', flex: 0.5, minWidth: 60, sortable: false, resizable: false, filter: false,
    cellRenderer: detailLinkRenderer<ProposalRow>('/proposals'),
  },
];

export default function ProposalListPage() {
  const { member } = usePOAuthStore();
  const [allProposals, setAllProposals] = useState<Proposal[]>([]);
  const [concerns, setConcerns] = useState<Concern[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const memberId = member?.id ?? 'm-001';

  useEffect(() => {
    Promise.all([
      fetch(`/api/proposals?memberId=${memberId}`).then(r => r.json()),
      fetch('/api/concerns').then(r => r.json()),
    ]).then(([pData, cData]) => {
      setAllProposals(pData.proposals ?? []);
      setConcerns(cData.concerns ?? []);
      setLoading(false);
    }).catch(() => { setError(true); setLoading(false); });
  }, [memberId]);

  const rowData: ProposalRow[] = allProposals.map(p => {
    const concern = concerns.find(c => c.id === p.concernId);
    return {
      id: p.id,
      area: concern?.primaryArea || '-',
      detail: concern?.bodyAreaDetail || '',
      hospitalName: MOCK_PARTNER_PROFILES.find(pp => pp.memberId === p.memberId)?.hospitalName || '',
      totalPrice: `${p.totalPrice}만`,
      status: p.status,
      statusLabel: PROPOSAL_STATUS_KR[p.status] || p.status,
      sentAt: formatDateKR(p.sentAt),
      viewedAt: p.viewedAt ? formatDateKR(p.viewedAt) : '미열람',
    };
  });

  if (loading) {
    return (
      <AdminPage sidebar={<POSidebar active="/proposals" />} title="발송 내역" prefix="po">
        <div className="text-center py-20"><Spinner /></div>
      </AdminPage>
    );
  }

  if (error) {
    return (
      <AdminPage sidebar={<POSidebar active="/proposals" />} title="발송 내역" prefix="po">
        <div className="text-center py-20 text-[#9ca3af]">데이터를 불러오지 못했습니다. 새로고침해 주세요.</div>
      </AdminPage>
    );
  }

  return (
    <AdminPage sidebar={<POSidebar active="/proposals" />} title="발송 내역" prefix="po">
      <DataGrid<ProposalRow>
        columnDefs={columnDefs}
        rowData={rowData}
        searchFields={searchFields}
        exportFileName="발송내역"
        title="발송 내역"
      />
    </AdminPage>
  );
}

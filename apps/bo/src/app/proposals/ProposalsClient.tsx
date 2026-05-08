'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  PROPOSAL_STATUS_KR, PROPOSAL_STATUS_BADGE, BODY_AREA_DOT,
  formatDateKR, formatKRW,
} from '@hyliren/shared';
import { BOSidebar } from '@/components/BOSidebar';
import { DataGrid, AdminPage, dotTextRenderer, detailLinkRenderer, Spinner } from '@hyliren/ui';
import type { SearchField } from '@hyliren/ui';
import type { ColDef } from 'ag-grid-community';
import { listProposals, type AdminProposalListItem } from '@/lib/api/admin-proposals';

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
    { value: 'sent', label: '발송' }, { value: 'accepted', label: '선택됨' }, { value: 'rejected', label: '거절' },
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
  { field: 'totalPrice', headerName: '가격', flex: 0.8, minWidth: 120, filter: false,
    // 원 단위 가격 (예: "1,500,000원") 약 95~110px 필요 — 80px 시 truncation 발생
    cellStyle: { fontWeight: 600, fontVariantNumeric: 'tabular-nums' },
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
    cellStyle: { color: 'var(--text-disabled)', fontVariantNumeric: 'tabular-nums' },
  },
  { headerName: '액션', flex: 0.4, minWidth: 50, sortable: false, resizable: false, filter: false,
    cellRenderer: detailLinkRenderer<ProposalRow>('/proposals', '상세', 'var(--text-default)'),
  },
];

function toRow(item: AdminProposalListItem): ProposalRow {
  return {
    id: item.id,
    area: item.primaryArea || '-',
    hospitalName: item.hospitalName || item.memberId,
    totalPrice: formatKRW(item.totalPrice),
    statusEnum: item.status,
    sentAt: formatDateKR(item.sentAt),
  };
}

export function ProposalsClient() {
  const router = useRouter();
  const [rows, setRows] = useState<ProposalRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    listProposals()
      .then((items) => { if (!cancelled) setRows(items.map(toRow)); })
      .catch((e: unknown) => {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : '제안서 목록을 불러오지 못했습니다.');
      });
    return () => { cancelled = true; };
  }, []);

  return (
    <AdminPage sidebar={<BOSidebar active="/proposals" />} title="제안서 관리" prefix="bo">
      {error ? (
        <div style={{ padding: 24, color: 'var(--color-danger,#d72c0d)', fontSize: 13 }}>{error}</div>
      ) : rows === null ? (
        <div style={{ minHeight: 240, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Spinner />
        </div>
      ) : (
        <DataGrid<ProposalRow>
          columnDefs={columnDefs}
          rowData={rows}
          searchFields={searchFields}
          exportFileName="제안서목록"
          title="제안서 목록"
          onRowClick={(data) => router.push(`/proposals/${data.id}`)}
        />
      )}
    </AdminPage>
  );
}

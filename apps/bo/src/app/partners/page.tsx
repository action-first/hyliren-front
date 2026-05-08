'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Spinner, DataGrid, AdminPage, badgeCellRenderer, detailLinkRenderer } from '@hyliren/ui';
import type { SearchField } from '@hyliren/ui';
import type { ColDef } from 'ag-grid-community';
import { BOSidebar } from '@/components/BOSidebar';
import { listPartners, type AdminPartnerListItem } from '@/lib/api/admin-partners';

const BO_ACCENT = 'var(--text-default)';

const VERIFIED_BADGE: Record<string, { bg: string; text: string }> = {
  '인증':   { bg: '#dcfce7', text: '#166534' },
  '미인증': { bg: '#f3f4f6', text: '#6b7280' },
};

interface PartnerRow {
  id: string;
  hospitalName: string;
  specialties: string;
  verified: string;
  proposalCount: number;
  selectRate: string;
}

const searchFields: SearchField[] = [
  { key: 'specialties', label: '전문분야', type: 'select', row: 1, options: [
    { value: '눈', label: '눈' }, { value: '코', label: '코' },
    { value: '리프팅', label: '리프팅' }, { value: '피부', label: '피부' },
  ]},
  { key: 'verified', label: '인증', type: 'select', row: 1, options: [
    { value: '인증', label: '인증' }, { value: '미인증', label: '미인증' },
  ]},
  { key: '_keyword', label: '키워드', placeholder: '병원명, 전문분야 통합 검색', row: 2 },
];

const columnDefs: ColDef<PartnerRow>[] = [
  { field: 'hospitalName', headerName: '병원명', flex: 1.2, minWidth: 150, filter: true,
    cellStyle: { fontWeight: 500 },
  },
  { field: 'specialties', headerName: '전문분야', flex: 1, minWidth: 120, filter: true },
  { field: 'verified', headerName: '인증', flex: 0.5, minWidth: 70, filter: true,
    cellRenderer: badgeCellRenderer(VERIFIED_BADGE),
  },
  { field: 'proposalCount', headerName: '제안서', flex: 0.5, minWidth: 70, filter: false,
    cellStyle: { fontVariantNumeric: 'tabular-nums' },
  },
  { field: 'selectRate', headerName: '선택률', flex: 0.5, minWidth: 70, filter: false,
    cellStyle: { fontWeight: 600, fontVariantNumeric: 'tabular-nums' },
  },
  { headerName: '액션', flex: 0.4, minWidth: 50, sortable: false, resizable: false, filter: false,
    cellRenderer: detailLinkRenderer<PartnerRow>('/partners', '상세', BO_ACCENT),
  },
];

function toRow(item: AdminPartnerListItem): PartnerRow {
  return {
    id: item.id,
    hospitalName: item.hospitalName,
    specialties: item.specialties.join(', '),
    verified: item.verified ? '인증' : '미인증',
    proposalCount: item.proposalCount,
    selectRate: `${item.selectRate}%`,
  };
}

export default function PartnersPage() {
  const router = useRouter();
  const [rows, setRows] = useState<PartnerRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    listPartners()
      .then((items) => {
        if (cancelled) return;
        setRows(items.map(toRow));
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : '병원 목록을 불러오지 못했습니다.');
      });
    return () => { cancelled = true; };
  }, []);

  return (
    <AdminPage sidebar={<BOSidebar active="/partners" />} title="병원 관리" prefix="bo">
      {error ? (
        <div style={{ padding: 24, color: 'var(--color-danger,#d72c0d)', fontSize: 13 }}>{error}</div>
      ) : rows === null ? (
        <div style={{ minHeight: 240, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Spinner />
        </div>
      ) : (
        <DataGrid<PartnerRow>
          columnDefs={columnDefs}
          rowData={rows}
          searchFields={searchFields}
          exportFileName="병원목록"
          title="병원 목록"
          onRowClick={(data) => router.push(`/partners/${data.id}`)}
        />
      )}
    </AdminPage>
  );
}

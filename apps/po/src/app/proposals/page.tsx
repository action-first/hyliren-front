'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  PROPOSAL_STATUS_BADGE,
  PROPOSAL_STATUS_KR,
  formatDateKR,
  formatBudget,
} from '@hyliren/shared';
import {
  AdminPage,
  DataGrid,
  badgeCellRenderer,
} from '@hyliren/ui';
import type { SearchField } from '@hyliren/ui';
import type { ColDef } from 'ag-grid-community';
import { POSidebar } from '@/components/POSidebar';
import { listConcerns, type ConcernSummaryWire } from '@/lib/api/concern';
import { formatKrwAsMan, listMyProposals, type ProposalDetailWire } from '@/lib/api/proposal';

interface ProposalRow {
  id: string;
  sentAt: string;
  concern: string;
  budget: string;
  totalPrice: string;
  itemNames: string;
  statusLabel: string;
}

const searchFields: SearchField[] = [
  { key: 'sentAt', label: '기간', type: 'dateRange', row: 1 },
  { key: 'statusLabel', label: '상태', type: 'select', row: 1, options: [
    { value: '발송', label: '발송' },
    { value: '열람', label: '열람' },
    { value: '선택됨', label: '선택됨' },
    { value: '거절', label: '거절' },
  ]},
  { key: '_keyword', label: '키워드', placeholder: '고민, 시술명 통합 검색', row: 2 },
];

const columnDefs: ColDef<ProposalRow>[] = [
  { field: 'sentAt', headerName: '발송일', flex: 0.7, minWidth: 90, filter: false,
    cellStyle: { color: 'var(--text-disabled)', fontVariantNumeric: 'tabular-nums' },
  },
  { field: 'concern', headerName: '고민', flex: 1.2, minWidth: 150, filter: true },
  { field: 'itemNames', headerName: '시술 항목', flex: 1.3, minWidth: 180, filter: true,
    cellStyle: { color: 'var(--text-subdued)' },
  },
  { field: 'budget', headerName: '고객 예산', flex: 0.8, minWidth: 100, filter: false },
  { field: 'totalPrice', headerName: '제안 금액', flex: 0.7, minWidth: 100, filter: false,
    cellStyle: { fontWeight: 700, color: 'var(--text-default)', fontVariantNumeric: 'tabular-nums' },
  },
  { field: 'statusLabel', headerName: '상태', flex: 0.6, minWidth: 80, filter: true,
    cellRenderer: badgeCellRenderer(PROPOSAL_STATUS_BADGE),
  },
];

function describeConcern(concern: ConcernSummaryWire | undefined): string {
  if (!concern) return '-';
  return [concern.primaryArea, concern.bodyAreaDetail].filter(Boolean).join(' ');
}

function toRow(proposal: ProposalDetailWire, concerns: ConcernSummaryWire[]): ProposalRow {
  const concern = concerns.find(c => c.id === proposal.concernId);
  return {
    id: proposal.id,
    sentAt: formatDateKR(proposal.sentAt),
    concern: describeConcern(concern),
    budget: concern ? formatBudget(concern.budgetMin, concern.budgetMax) : '-',
    totalPrice: formatKrwAsMan(proposal.totalPrice),
    itemNames: proposal.items.map(item => item.treatmentName).join(', ') || '-',
    statusLabel: PROPOSAL_STATUS_KR[proposal.status] || proposal.status,
  };
}

export default function ProposalsPage() {
  const router = useRouter();
  const [proposals, setProposals] = useState<ProposalDetailWire[]>([]);
  const [concerns, setConcerns] = useState<ConcernSummaryWire[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    Promise.all([listMyProposals(), listConcerns()])
      .then(([proposalData, concernData]) => {
        setProposals(proposalData.proposals);
        setConcerns(concernData.concerns);
        setLoading(false);
      })
      .catch(() => {
        setError(true);
        setLoading(false);
      });
  }, []);

  if (loading) return null;

  if (error) {
    return (
      <AdminPage sidebar={<POSidebar active="/activity" />} title="제안서 목록" prefix="po">
        <div className="text-center py-20 text-[var(--text-disabled)]">제안서 데이터를 불러오지 못했습니다. 새로고침해 주세요.</div>
      </AdminPage>
    );
  }

  return (
    <AdminPage sidebar={<POSidebar active="/activity" />} title="제안서 목록" prefix="po">
      <DataGrid<ProposalRow>
        columnDefs={columnDefs}
        rowData={proposals.map(p => toRow(p, concerns))}
        searchFields={searchFields}
        exportFileName="제안서목록"
        title="내 제안서"
        onRowClick={(data) => router.push(`/proposals/${data.id}`)}
      />
    </AdminPage>
  );
}

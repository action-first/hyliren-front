'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  PROPOSAL_STATUS_BADGE,
  PROPOSAL_STATUS_KR,
  formatDateKR,
  formatBudget,
} from '@hyliren/shared';
import {
  AdminPage, Card, Spinner, Button, DataGrid,
  badgeCellRenderer,
} from '@hyliren/ui';
import type { SearchField } from '@hyliren/ui';
import { AlertTriangle } from 'lucide-react';
import type { ColDef } from 'ag-grid-community';
import { POSidebar } from '@/components/POSidebar';
import { useToastStore } from '@/store/toast';
import { listConcerns, type ConcernSummaryWire } from '@/lib/api/concern';
import {
  formatKrwAsMan,
  listMyProposals,
  type MyProposalsQuery,
  type ProposalDetailWire,
} from '@/lib/api/proposal';

interface ProposalRow {
  id: string;
  sentAt: string;
  concern: string;
  budget: string;
  totalPrice: string;
  itemNames: string;
  statusLabel: string;
}

// 한국어 라벨 → backend ProposalStatus 매핑 (역매핑은 lossy 한 항목 제외)
const STATUS_LABEL_TO_RAW: Record<string, string> = {
  '발송': 'sent',
  '선택됨': 'accepted',
  '거절': 'rejected',
};

// 디폴트 — 최근 한달
function defaultMonthRange(): { from: string; to: string } {
  const today = new Date();
  const monthAgo = new Date();
  monthAgo.setMonth(today.getMonth() - 1);
  const fmt = (d: Date) => d.toISOString().slice(0, 10);
  return { from: fmt(monthAgo), to: fmt(today) };
}

const searchFields: SearchField[] = [
  { key: 'sentAt', label: '기간', type: 'dateRange', row: 1 },
  { key: 'statusLabel', label: '상태', type: 'select', row: 1, options: [
    { value: '발송', label: '발송' },
    { value: '선택됨', label: '선택됨' },
    { value: '거절', label: '거절' },
  ]},
  { key: '_keyword', label: '키워드', placeholder: '시술명 통합 검색', row: 2 },
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
  const showToast = useToastStore(s => s.showToast);
  const [proposals, setProposals] = useState<ProposalDetailWire[]>([]);
  const [concerns, setConcerns] = useState<ConcernSummaryWire[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  // 마지막 query 보존 — 재시도 시 동일 query 재호출.
  const [lastQuery, setLastQuery] = useState<MyProposalsQuery>({});

  const fetchProposals = useCallback((query: MyProposalsQuery) => {
    setLoading(true);
    setLoadError(null);
    setLastQuery(query);
    Promise.all([listMyProposals(query), listConcerns()])
      .then(([proposalData, concernData]) => {
        setProposals(proposalData.proposals);
        setConcerns(concernData.concerns);
      })
      .catch((e: unknown) => {
        const msg = e instanceof Error ? e.message : '제안서 데이터를 불러올 수 없습니다';
        setLoadError(msg);
        showToast(msg, 'error');
      })
      .finally(() => setLoading(false));
  }, [showToast]);

  useEffect(() => {
    const { from, to } = defaultMonthRange();
    fetchProposals({ sentAtFrom: from, sentAtTo: to });
  }, [fetchProposals]);

  function handleSearch(filters: Record<string, string>) {
    const query: MyProposalsQuery = {};
    if (filters['sentAt_from']) query.sentAtFrom = filters['sentAt_from'];
    if (filters['sentAt_to']) query.sentAtTo = filters['sentAt_to'];
    const rawStatus = filters['statusLabel'] ? STATUS_LABEL_TO_RAW[filters['statusLabel']] : undefined;
    if (rawStatus) query.status = rawStatus;
    if (filters['_keyword']) query.keyword = filters['_keyword'];
    fetchProposals(query);
  }

  return (
    <AdminPage sidebar={<POSidebar active="/activity" />} title="제안서 목록" prefix="po">
      {loading && (
        <Card padding="md">
          <div className="flex items-center justify-center py-12"><Spinner /></div>
        </Card>
      )}

      {!loading && loadError && (
        <Card padding="md">
          <div className="text-center py-10">
            <AlertTriangle size={28} className="mx-auto mb-2 text-[var(--color-danger)]" />
            <p className="text-[var(--text-sm)] font-medium text-[var(--text-default)] mb-1">
              제안서 목록을 불러오지 못했어요
            </p>
            <p className="text-[var(--text-xs)] text-[var(--text-disabled)] mb-4">{loadError}</p>
            <Button variant="secondary" size="sm" onClick={() => fetchProposals(lastQuery)}>
              다시 시도
            </Button>
          </div>
        </Card>
      )}

      {!loading && !loadError && (
        <DataGrid<ProposalRow>
          columnDefs={columnDefs}
          rowData={proposals.map(p => toRow(p, concerns))}
          searchFields={searchFields}
          exportFileName="제안서목록"
          title="내 제안서"
          onRowClick={(data) => router.push(`/proposals/${data.id}`)}
          onSearch={handleSearch}
        />
      )}
    </AdminPage>
  );
}

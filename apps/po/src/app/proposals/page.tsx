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
  AdminPage, Card, Spinner, Button, DataGrid,
  badgeCellRenderer,
} from '@hyliren/ui';
import type { SearchField } from '@hyliren/ui';
import { AlertTriangle } from 'lucide-react';
import type { ColDef } from 'ag-grid-community';
import { POSidebar } from '@/components/POSidebar';
import { useToastStore } from '@/store/toast';
import { useLocaleStore } from '@/store/locale';
import { useDataGridLabels } from '@/hooks/useDataGridLabels';
import { toUserMessage } from '@/lib/api/error-messages';
import { useConcerns } from '@/hooks/queries/concerns';
import { useMyProposals } from '@/hooks/queries/proposals';
import type { ConcernSummaryWire } from '@/lib/api/concern';
import {
  formatKrwAsMan,
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
  const t = useLocaleStore(s => s.t);
  const dataGridLabels = useDataGridLabels();
  const [query, setQuery] = useState<MyProposalsQuery>(() => {
    const { from, to } = defaultMonthRange();
    return { sentAtFrom: from, sentAtTo: to };
  });

  const searchFields: SearchField[] = [
    { key: 'sentAt', label: t('po.proposalSearchPeriod'), type: 'dateRange', row: 1 },
    { key: 'statusLabel', label: t('po.proposalSearchStatus'), type: 'select', row: 1, options: [
      { value: '발송', label: t('po.proposalStatusFilterSent') },
      { value: '선택됨', label: t('po.proposalStatusFilterAccepted') },
      { value: '거절', label: t('po.proposalStatusFilterRejected') },
    ]},
    { key: '_keyword', label: t('po.proposalSearchKeyword'), placeholder: t('po.proposalSearchKeywordPlaceholder'), row: 2 },
  ];

  const columnDefs: ColDef<ProposalRow>[] = [
    { field: 'sentAt', headerName: t('po.proposalColSentAt'), flex: 0.7, minWidth: 90, filter: false,
      cellStyle: { color: 'var(--text-disabled)', fontVariantNumeric: 'tabular-nums' },
    },
    { field: 'concern', headerName: t('po.proposalColConcern'), flex: 1.2, minWidth: 150, filter: true },
    { field: 'itemNames', headerName: t('po.proposalColItems'), flex: 1.3, minWidth: 180, filter: true,
      cellStyle: { color: 'var(--text-subdued)' },
    },
    { field: 'budget', headerName: t('po.proposalColBudget'), flex: 0.8, minWidth: 100, filter: false },
    { field: 'totalPrice', headerName: t('po.proposalColTotal'), flex: 0.7, minWidth: 100, filter: false,
      cellStyle: { fontWeight: 700, color: 'var(--text-default)', fontVariantNumeric: 'tabular-nums' },
    },
    { field: 'statusLabel', headerName: t('po.proposalColStatus'), flex: 0.6, minWidth: 80, filter: true,
      cellRenderer: badgeCellRenderer(PROPOSAL_STATUS_BADGE),
    },
  ];

  // React Query — 캐시 5분 + keepPreviousData. /activity, /dashboard 와 cache 공유.
  const proposalsQ = useMyProposals(query);
  const concernsQ = useConcerns(); // 제안서 row 의 concern 정보 매핑용

  // 에러 토스트 (proposals 우선, concerns 는 silent fallback)
  useEffect(() => {
    if (proposalsQ.isError && proposalsQ.error) {
      const msg = toUserMessage(proposalsQ.error, t('po.proposalListFail'));
      showToast(msg, 'error');
    }
  }, [proposalsQ.isError, proposalsQ.error, showToast, t]);

  // 초기 load 완료 = proposals 데이터 한 번이라도 채워졌을 때.
  const hasInitialLoad = proposalsQ.data !== undefined;
  const proposals: ProposalDetailWire[] = proposalsQ.data?.proposals ?? [];
  const concerns: ConcernSummaryWire[] = concernsQ.data?.concerns ?? [];

  function handleSearch(filters: Record<string, string>) {
    const newQuery: MyProposalsQuery = {};
    if (filters['sentAt_from']) newQuery.sentAtFrom = filters['sentAt_from'];
    if (filters['sentAt_to']) newQuery.sentAtTo = filters['sentAt_to'];
    const rawStatus = filters['statusLabel'] ? STATUS_LABEL_TO_RAW[filters['statusLabel']] : undefined;
    if (rawStatus) newQuery.status = rawStatus;
    if (filters['_keyword']) newQuery.keyword = filters['_keyword'];
    setQuery(newQuery);
  }

  return (
    <AdminPage sidebar={<POSidebar active="/activity" />} title={t('po.proposalListTitle')} prefix="po">
      {/* 초기 1회 load 전 spinner / error */}
      {!hasInitialLoad && proposalsQ.isLoading && (
        <Card padding="md">
          <div className="flex items-center justify-center py-12"><Spinner /></div>
        </Card>
      )}

      {!hasInitialLoad && proposalsQ.isError && (
        <Card padding="md">
          <div className="text-center py-10">
            <AlertTriangle size={28} className="mx-auto mb-2 text-[var(--color-danger)]" />
            <p className="text-[var(--text-sm)] font-medium text-[var(--text-default)] mb-1">
              {t('po.proposalListEmpty')}
            </p>
            <p className="text-[var(--text-xs)] text-[var(--text-disabled)] mb-4">
              {toUserMessage(proposalsQ.error, t('po.unknownError'))}
            </p>
            <Button variant="secondary" size="sm" onClick={() => proposalsQ.refetch()}>
              {t('po.proposalListRetry')}
            </Button>
          </div>
        </Card>
      )}

      {/* 초기 load 후 DataGrid 유지 — 검색 form state 보존 */}
      {hasInitialLoad && (
        <DataGrid<ProposalRow>
          columnDefs={columnDefs}
          rowData={proposals.map(p => toRow(p, concerns))}
          searchFields={searchFields}
          exportFileName={t('po.proposalExportFile')}
          title={t('po.myProposalSheetTitle')}
          labels={dataGridLabels}
          onRowClick={(data) => router.push(`/proposals/${data.id}`)}
          onSearch={handleSearch}
        />
      )}
    </AdminPage>
  );
}

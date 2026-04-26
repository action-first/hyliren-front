'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  PROPOSAL_STATUS_KR, PROPOSAL_STATUS_BADGE,
  formatDateKR,
  formatBudget,
  CREDIT_COST,
} from '@hyliren/shared';
import {
  Card, AdminPage, DataGrid, Spinner, Button,
  badgeCellRenderer, dotTextRenderer,
} from '@hyliren/ui';
import type { SearchField } from '@hyliren/ui';
import { AlertTriangle, FileEdit } from 'lucide-react';
import { POSidebar } from '@/components/POSidebar';
import { MyProposalSheet } from '@/components/concerns/MyProposalSheet';
import { useCreditsStore } from '@/store/credits';
import { useToastStore } from '@/store/toast';
import { listConcerns, type ConcernSummaryWire } from '@/lib/api/concern';
import { formatKrwAsMan, listMyProposals, type ProposalDetailWire } from '@/lib/api/proposal';
import type { ColDef } from 'ag-grid-community';
import React from 'react';

// ── 통합 활동 행 타입 ──
interface ActivityRow {
  id: string;
  date: string;
  type: string;
  typeLabel: string;
  description: string;
  credit: string;
  statusLabel: string;
  /** proposal row 한정 — 클릭 시 사이드 시트 진입에 사용. 다른 row 는 undefined. */
  concernId?: string;
}

// ── 타입 dot 색상 ──
const TYPE_DOT: Record<string, string> = {
  '제안서 발송': 'var(--interactive-default)', '크레딧 충전': 'var(--color-success)', '크레딧 차감': 'var(--color-danger)',
};

// ── 검색 ──
const searchFields: SearchField[] = [
  { key: 'date', label: '기간', type: 'dateRange', row: 1 },
  { key: 'typeLabel', label: '유형', type: 'select', row: 1, options: [
    { value: '제안서 발송', label: '제안서 발송' },
    { value: '크레딧 충전', label: '크레딧 충전' },
  ]},
  { key: '_keyword', label: '키워드', placeholder: '내용, 부위 통합 검색', row: 2 },
];

// ── 컬럼 ──
const columnDefs: ColDef<ActivityRow>[] = [
  { field: 'date', headerName: '날짜', flex: 0.7, minWidth: 90, filter: false,
    cellStyle: { color: 'var(--text-disabled)', fontVariantNumeric: 'tabular-nums' },
  },
  { field: 'typeLabel', headerName: '유형', flex: 0.6, minWidth: 90, filter: true,
    cellRenderer: dotTextRenderer(TYPE_DOT),
  },
  { field: 'description', headerName: '내용', flex: 1.5, minWidth: 180, filter: true,
    cellStyle: { color: 'var(--text-default)' },
  },
  { field: 'credit', headerName: '크레딧', flex: 0.5, minWidth: 70, filter: false,
    cellRenderer: (p: { value: string }) => {
      if (!p.value || p.value === '-') return <span style={{ color: 'var(--border-default)' }}>-</span>;
      const isPlus = p.value.startsWith('+');
      return (
        <span style={{
          fontSize: 13, fontWeight: 600, fontVariantNumeric: 'tabular-nums',
          color: isPlus ? 'var(--interactive-default)' : 'var(--color-danger)',
        }}>{p.value}</span>
      );
    },
  },
  { field: 'statusLabel', headerName: '상태', flex: 0.6, minWidth: 80, filter: true,
    cellRenderer: badgeCellRenderer(PROPOSAL_STATUS_BADGE),
  },
];

export default function ActivityPage() {
  const { balance, transactions } = useCreditsStore();
  const showToast = useToastStore(s => s.showToast);

  const [proposals, setProposals] = useState<ProposalDetailWire[]>([]);
  const [concerns, setConcerns] = useState<ConcernSummaryWire[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  // 제안서 row 클릭 시 사이드 시트로 상세 노출. concernId 기반.
  const [selectedConcernId, setSelectedConcernId] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setLoadError(null);
    Promise.all([listMyProposals(), listConcerns()])
      .then(([pData, cData]) => {
        setProposals(pData.proposals ?? []);
        setConcerns(cData.concerns ?? []);
      })
      .catch((e: unknown) => {
        const msg = e instanceof Error ? e.message : '활동 내역을 불러올 수 없습니다';
        setLoadError(msg);
        showToast(msg, 'error');
      })
      .finally(() => setLoading(false));
  }, [showToast]);

  useEffect(() => { load(); }, [load]);

  // ── 통합 타임라인 데이터 ──
  const rowData: ActivityRow[] = [
    ...proposals.map(p => {
      const concern = concerns.find(c => c.id === p.concernId);
      return {
        id: `prop-${p.id}`,
        date: formatDateKR(p.sentAt),
        type: 'proposal',
        typeLabel: '제안서 발송',
        description: `${concern ? `${concern.primaryArea} ${concern.bodyAreaDetail || ''}` : '-'} · ${formatBudget(concern?.budgetMin ?? null, concern?.budgetMax ?? null)} · ${formatKrwAsMan(p.totalPrice)}`,
        credit: `-${CREDIT_COST}`,
        statusLabel: PROPOSAL_STATUS_KR[p.status] || p.status,
        concernId: p.concernId,
      };
    }),
    ...transactions.filter(tx => tx.amount > 0).map(tx => ({
      id: `tx-${tx.id}`,
      date: tx.date,
      type: 'credit',
      typeLabel: '크레딧 충전',
      description: tx.reason,
      credit: `+${tx.amount}`,
      statusLabel: '',
    })),
  ].sort((a, b) => (a.date > b.date ? -1 : a.date < b.date ? 1 : 0));

  return (
    <AdminPage sidebar={<POSidebar active="/activity" />} title="활동 내역" prefix="po">

      {/* 크레딧 잔액 요약 — 항상 노출 (로딩/에러 상태 무관) */}
      <Card padding="md" className="mb-5">
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
          <span style={{ fontSize: 13, color: 'var(--text-disabled)' }}>크레딧 잔액</span>
          <span style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-default)', fontVariantNumeric: 'tabular-nums' }}>{balance}</span>
          <span style={{ fontSize: 12, color: 'var(--text-disabled)' }}>
            · {Math.floor(balance / 3)}건 발송 가능
          </span>
        </div>
      </Card>

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
              활동 내역을 불러오지 못했어요
            </p>
            <p className="text-[var(--text-xs)] text-[var(--text-disabled)] mb-4">{loadError}</p>
            <Button variant="secondary" size="sm" onClick={load}>
              다시 시도
            </Button>
          </div>
        </Card>
      )}

      {!loading && !loadError && rowData.length === 0 && (
        <Card padding="md">
          <div className="text-center py-12">
            <FileEdit size={28} className="mx-auto mb-2 text-[var(--text-disabled)]" />
            <p className="text-[var(--text-base)] font-medium text-[var(--text-default)] mb-1">
              아직 활동 내역이 없어요
            </p>
            <p className="text-[var(--text-sm)] text-[var(--text-subdued)]">
              제안서를 발송하거나 크레딧을 충전하면 이곳에 기록됩니다.
            </p>
          </div>
        </Card>
      )}

      {!loading && !loadError && rowData.length > 0 && (
        <DataGrid<ActivityRow>
          columnDefs={columnDefs}
          rowData={rowData}
          searchFields={searchFields}
          exportFileName="활동내역"
          title="발송 & 크레딧 내역"
          onRowClick={(row) => {
            // 제안서 row 만 클릭 가능 — 크레딧 충전/차감 row 는 detail 없음.
            if (row.type === 'proposal' && row.concernId) {
              setSelectedConcernId(row.concernId);
            }
          }}
        />
      )}

      {/* 제안서 상세 사이드 시트 — 같은 컴포넌트 (concern 상세 페이지와 일관). */}
      <MyProposalSheet
        concernId={selectedConcernId ?? ''}
        open={selectedConcernId !== null}
        onClose={() => setSelectedConcernId(null)}
      />
    </AdminPage>
  );
}

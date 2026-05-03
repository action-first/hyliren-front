'use client';

import { useState, useEffect } from 'react';
import {
  PROPOSAL_STATUS_BADGE,
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
import { useToastStore } from '@/store/toast';
import { useLocaleStore } from '@/store/locale';
import { useDataGridLabels } from '@/hooks/useDataGridLabels';
import { toUserMessage } from '@/lib/api/error-messages';
import { useConcerns } from '@/hooks/queries/concerns';
import { useMyProposals } from '@/hooks/queries/proposals';
import { useCreditBalance, useCreditTransactions } from '@/hooks/queries/credits';
import { formatKrwAsMan } from '@/lib/api/proposal';
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
  /** proposal.status enum (sent/viewed/shortlisted/...) — cellRenderer 가 t() 매핑. 비-proposal row 는 ''. */
  statusEnum: string;
  /** proposal row 한정 — 클릭 시 사이드 시트 진입에 사용. 다른 row 는 undefined. */
  concernId?: string;
}

export default function ActivityPage() {
  const showToast = useToastStore(s => s.showToast);
  const t = useLocaleStore(s => s.t);
  const locale = useLocaleStore(s => s.locale);
  const dataGridLabels = useDataGridLabels();

  // CREDIT reason 라벨 (locale 별)
  const CREDIT_REASON_LABELS: Record<string, string> = {
    purchase: t('po.activityCreditPurchase'),
    refund: t('po.activityCreditRefund'),
    proposal_send: t('po.activityProposalSend'),
    subscription_grant: t('po.activitySubscriptionGrant'),
    admin_adjust: t('po.activityAdminAdjust'),
  };

  const TYPE_DOT: Record<string, string> = {
    [t('po.activityProposalSend')]: 'var(--interactive-default)',
    [t('po.activityCreditPurchase')]: 'var(--color-success)',
    [t('po.activityCreditDeduct')]: 'var(--color-danger)',
  };

  const searchFields: SearchField[] = [
    { key: 'date', label: t('po.activityFilterPeriod'), type: 'dateRange', row: 1 },
    { key: 'typeLabel', label: t('po.activityFilterType'), type: 'select', row: 1, options: [
      { value: t('po.activityProposalSend'), label: t('po.activityProposalSend') },
      { value: t('po.activityCreditPurchase'), label: t('po.activityCreditPurchase') },
    ]},
    { key: '_keyword', label: t('po.activityFilterKeyword'), placeholder: t('po.activityFilterKeywordPh'), row: 2 },
  ];

  const columnDefs: ColDef<ActivityRow>[] = [
    { field: 'date', headerName: t('po.activityColDate'), flex: 0.7, minWidth: 90, filter: false,
      cellStyle: { color: 'var(--text-disabled)', fontVariantNumeric: 'tabular-nums' },
    },
    { field: 'typeLabel', headerName: t('po.activityColType'), flex: 0.6, minWidth: 90, filter: true,
      cellRenderer: dotTextRenderer(TYPE_DOT),
    },
    { field: 'description', headerName: t('po.activityColContent'), flex: 1.5, minWidth: 180, filter: true,
      cellStyle: { color: 'var(--text-default)' },
    },
    { field: 'credit', headerName: t('po.activityColCredit'), flex: 0.5, minWidth: 70, filter: false,
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
    { field: 'statusEnum', headerName: t('po.activityColStatus'), flex: 0.6, minWidth: 80, filter: true,
      cellRenderer: (p: { value: string }) => {
        if (!p.value) return null;
        const c = PROPOSAL_STATUS_BADGE[p.value] || { bg: '#f3f4f6', text: '#374151' };
        const label = t(`po.proposalStatus.${p.value}`) || p.value;
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
  ];

  // React Query — /proposals, /dashboard 와 cache 공유 (5분 staleTime).
  const proposalsQ = useMyProposals();
  const concernsQ = useConcerns();
  const balanceQ = useCreditBalance();
  const transactionsQ = useCreditTransactions();
  const balance = balanceQ.data?.balance ?? 0;
  const transactions = transactionsQ.data?.transactions ?? [];
  const isLoading = proposalsQ.isLoading || concernsQ.isLoading || balanceQ.isLoading || transactionsQ.isLoading;
  const isError = proposalsQ.isError || concernsQ.isError || balanceQ.isError || transactionsQ.isError;
  const errorObj = proposalsQ.error || concernsQ.error || balanceQ.error || transactionsQ.error;

  // 에러 토스트
  useEffect(() => {
    if (isError && errorObj) {
      const msg = toUserMessage(errorObj, t('po.activityLoadError'));
      showToast(msg, 'error');
    }
  }, [isError, errorObj, showToast]);

  const proposals = proposalsQ.data?.proposals ?? [];
  const concerns = concernsQ.data?.concerns ?? [];
  const hasInitialLoad =
    proposalsQ.data !== undefined &&
    concernsQ.data !== undefined &&
    transactionsQ.data !== undefined;

  const refetchAll = () => {
    void proposalsQ.refetch();
    void concernsQ.refetch();
    void balanceQ.refetch();
    void transactionsQ.refetch();
  };

  // 제안서 row 클릭 시 사이드 시트로 상세 노출. concernId 기반.
  const [selectedConcernId, setSelectedConcernId] = useState<string | null>(null);

  // ── 통합 타임라인 데이터 ──
  const rowData: ActivityRow[] = [
    ...proposals.map(p => {
      const concern = concerns.find(c => c.id === p.concernId);
      const budgetMin = concern?.budgetMin ?? null;
      const budgetMax = concern?.budgetMax ?? null;
      const budgetText = (budgetMin == null && budgetMax == null)
        ? '-'
        : `${formatBudget(budgetMin, budgetMax)}${t('common.man')}`;
      return {
        id: `prop-${p.id}`,
        date: formatDateKR(p.sentAt, locale),
        type: 'proposal',
        typeLabel: t('po.activityProposalSend'),
        description: `${concern ? `${t(`common.bodyArea.${concern.primaryArea}`)} ${concern.bodyAreaDetail || ''}` : '-'} · ${budgetText} · ${formatKrwAsMan(p.totalPrice, locale, t('common.currency'))}`,
        credit: `-${CREDIT_COST}`,
        statusEnum: p.status,
        concernId: p.concernId,
      };
    }),
    /* BE 거래 이력 — proposal_send 는 proposal row 와 중복이라 제외.
       그 외 충전/환불/구독 적립/관리자 조정만 별도 row 로. */
    ...transactions
      .filter(tx => tx.reason !== 'proposal_send')
      .map(tx => ({
        id: `tx-${tx.id}`,
        date: formatDateKR(tx.createdAt, locale),
        type: 'credit',
        typeLabel: CREDIT_REASON_LABELS[tx.reason] ?? t('po.activityCreditTrade'),
        description: CREDIT_REASON_LABELS[tx.reason] ?? tx.reason,
        credit: tx.amount > 0 ? `+${tx.amount}` : `${tx.amount}`,
        statusEnum: '',
      })),
  ].sort((a, b) => (a.date > b.date ? -1 : a.date < b.date ? 1 : 0));

  return (
    <AdminPage sidebar={<POSidebar active="/activity" />} title={t('po.activityTitle')} prefix="po">

      {/* 크레딧 잔액 요약 — 항상 노출 (로딩/에러 상태 무관) */}
      <Card padding="md" className="mb-5">
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
          <span style={{ fontSize: 13, color: 'var(--text-disabled)' }}>{t('po.creditBalance')}</span>
          <span style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-default)', fontVariantNumeric: 'tabular-nums' }}>{balance}</span>
          <span style={{ fontSize: 12, color: 'var(--text-disabled)' }}>
            · {t('po.creditAvailableSends', { count: Math.floor(balance / 3) })}
          </span>
        </div>
      </Card>

      {/* 초기 1회 load 전 spinner / error */}
      {!hasInitialLoad && isLoading && (
        <Card padding="md">
          <div className="flex items-center justify-center py-12"><Spinner /></div>
        </Card>
      )}

      {!hasInitialLoad && isError && (
        <Card padding="md">
          <div className="text-center py-10">
            <AlertTriangle size={28} className="mx-auto mb-2 text-[var(--color-danger)]" />
            <p className="text-[var(--text-sm)] font-medium text-[var(--text-default)] mb-1">
              {t('po.activityLoadError')}
            </p>
            <p className="text-[var(--text-xs)] text-[var(--text-disabled)] mb-4">
              {toUserMessage(errorObj, t('po.unknownError'))}
            </p>
            <Button variant="secondary" size="sm" onClick={refetchAll}>
              {t('common.retry')}
            </Button>
          </div>
        </Card>
      )}

      {/* 초기 load 후 — 데이터 0 건이면 빈 상태, 아니면 DataGrid (mount 유지) */}
      {hasInitialLoad && rowData.length === 0 && (
        <Card padding="md">
          <div className="text-center py-12">
            <FileEdit size={28} className="mx-auto mb-2 text-[var(--text-disabled)]" />
            <p className="text-[var(--text-base)] font-medium text-[var(--text-default)] mb-1">
              {t('po.activityEmptyTitle')}
            </p>
            <p className="text-[var(--text-sm)] text-[var(--text-subdued)]">
              {t('po.activityEmptyDesc')}
            </p>
          </div>
        </Card>
      )}

      {hasInitialLoad && rowData.length > 0 && (
        <DataGrid<ActivityRow>
          columnDefs={columnDefs}
          rowData={rowData}
          searchFields={searchFields}
          exportFileName={t('po.activityExportFileName')}
          title={t('po.activityListTitle')}
          labels={dataGridLabels}
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

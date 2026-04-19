'use client';

import { useState } from 'react';
import { formatDateKR } from '@hyliren/shared';
import { Card, Button, SectionHeader, Modal, AdminPage, DataGrid } from '@hyliren/ui';
import type { SearchField } from '@hyliren/ui';
import { POSidebar } from '@/components/POSidebar';
import { useCreditsStore } from '@/store/credits';
import { useToastStore } from '@/store/toast';
import type { ColDef } from 'ag-grid-community';

// ── 충전 옵션 ──
const CHARGE_OPTIONS = [
  { amount: 10, price: '30,000' },
  { amount: 30, price: '80,000' },
  { amount: 50, price: '120,000' },
  { amount: 100, price: '200,000' },
];

// ── 거래 내역 행 타입 ──
interface TxRow {
  id: string;
  date: string;
  reason: string;
  amount: number;
  amountLabel: string;
  balance: number;
}

// ── 검색 필드 ──
const searchFields: SearchField[] = [
  { key: 'date', label: '기간', type: 'dateRange', row: 1 },
  { key: 'reason', label: '유형', type: 'select', row: 1, options: [
    { value: '크레딧 충전', label: '충전' },
    { value: '제안서 발송', label: '차감' },
  ]},
  { key: '_keyword', label: '키워드', placeholder: '내용 검색', row: 2 },
];

// ── 컬럼 정의 ──
const columnDefs: ColDef<TxRow>[] = [
  { field: 'date', headerName: '날짜', flex: 0.8, minWidth: 100, filter: false,
    cellStyle: { color: '#9ca3af', fontVariantNumeric: 'tabular-nums' },
  },
  { field: 'reason', headerName: '내용', flex: 1.5, minWidth: 150, filter: true },
  {
    field: 'amount', headerName: '변동', flex: 0.6, minWidth: 80, filter: false,
    cellRenderer: (p: { value: number; data: TxRow | undefined }) => {
      if (!p.data) return '';
      const isPlus = p.value > 0;
      const color = isPlus ? '#166534' : '#991b1b';
      const bg = isPlus ? '#dcfce7' : '#fef2f2';
      const label = isPlus ? `+${p.value}` : `${p.value}`;
      return `<span style="display:inline-block;padding:2px 8px;border-radius:4px;font-size:12px;font-weight:600;background:${bg};color:${color}">${label}</span>`;
    },
  },
  { field: 'balance', headerName: '잔액', flex: 0.6, minWidth: 70, filter: false,
    cellStyle: { fontWeight: 600, fontVariantNumeric: 'tabular-nums' },
  },
];

export default function CreditsPage() {
  const { balance, transactions, charge } = useCreditsStore();
  const { showToast } = useToastStore();
  const [showModal, setShowModal] = useState(false);
  const [selected, setSelected] = useState<number | null>(null);

  function handleCharge() {
    if (!selected) return;
    const opt = CHARGE_OPTIONS.find(o => o.amount === selected);
    charge(selected);
    fetch('/api/payments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'credit_charge',
        amount: parseInt((opt?.price || '0').replace(/,/g, '')),
        currency: 'KRW',
        actorType: 'partner',
        actorId: 'm-001',
        actorName: '강남아이 성형외과',
        status: 'paid',
      }),
    }).catch(() => {});
    showToast(`${selected}크레딧이 충전되었습니다.`, 'success');
    setShowModal(false);
    setSelected(null);
  }

  const rowData: TxRow[] = transactions.map(tx => ({
    id: tx.id,
    date: tx.date,
    reason: tx.reason,
    amount: tx.amount,
    amountLabel: tx.amount > 0 ? `+${tx.amount}` : `${tx.amount}`,
    balance: tx.balance,
  }));

  return (
    <AdminPage sidebar={<POSidebar active="/credits" />} title="크레딧 관리" prefix="po">

      {/* ── 잔액 카드 ── */}
      <Card padding="md" className="mb-5">
        <SectionHeader
          title="현재 잔액"
          action={
            <Button variant="accent" size="sm" onClick={() => setShowModal(true)}>
              크레딧 충전
            </Button>
          }
        />
        <div className="flex items-baseline gap-2 mt-4">
          <span style={{ fontSize: 32, fontWeight: 700, color: '#111827', fontVariantNumeric: 'tabular-nums' }}>{balance}</span>
          <span style={{ fontSize: 14, color: '#6b7280' }}>크레딧</span>
        </div>
        <p style={{ fontSize: 13, color: '#9ca3af', marginTop: 8 }}>
          제안서 1건 발송 시 3크레딧 차감 · 현재 잔액으로 <strong style={{ color: '#374151' }}>{Math.floor(balance / 3)}건</strong> 발송 가능
        </p>
      </Card>

      {/* ── 거래 내역 DataGrid ── */}
      <DataGrid<TxRow>
        columnDefs={columnDefs}
        rowData={rowData}
        searchFields={searchFields}
        exportFileName="크레딧내역"
        title="거래 내역"
      />

      {/* ── 충전 모달 ── */}
      <Modal open={showModal} onClose={() => { setShowModal(false); setSelected(null); }} title="크레딧 충전">
        <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 16 }}>
          충전할 크레딧을 선택하세요
        </p>
        <div className="charge-options">
          {CHARGE_OPTIONS.map(opt => (
            <button
              key={opt.amount}
              type="button"
              onClick={() => setSelected(opt.amount)}
              className={`charge-option ${selected === opt.amount ? 'charge-option--active' : ''}`}
            >
              <span style={{ fontSize: 18, fontWeight: 700 }}>{opt.amount}</span>
              <span style={{ fontSize: 12, color: '#6b7280' }}>크레딧</span>
              <span style={{ fontSize: 12, color: '#9ca3af' }}>{opt.price}원</span>
            </button>
          ))}
        </div>
        <p style={{ fontSize: 11, color: '#9ca3af', marginTop: 12, textAlign: 'center' }}>결제는 데모 모드입니다</p>
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="secondary" size="sm" onClick={() => { setShowModal(false); setSelected(null); }}>취소</Button>
          <Button variant="accent" size="sm" onClick={handleCharge} disabled={!selected}>
            {selected ? `${selected}크레딧 충전` : '충전'}
          </Button>
        </div>
      </Modal>
    </AdminPage>
  );
}

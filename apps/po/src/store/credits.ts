'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CreditTransaction {
  id: string;
  date: string;
  reason: string;
  amount: number; // 양수: 충전, 음수: 차감
  balance: number;
}

const INITIAL_TRANSACTIONS: CreditTransaction[] = [
  { id: 'tx-001', date: '2026-04-10', reason: '크레딧 충전', amount: 50, balance: 50 },
  { id: 'tx-002', date: '2026-04-11', reason: '제안서 발송 (c-001)', amount: -3, balance: 47 },
  { id: 'tx-003', date: '2026-04-11', reason: '제안서 발송 (c-005)', amount: -3, balance: 44 },
];

const INITIAL_BALANCE = 44;

interface CreditsState {
  balance: number;
  transactions: CreditTransaction[];
  /** 크레딧 충전. amount는 양수. */
  charge: (amount: number) => void;
  /** 크레딧 차감. 잔액 부족 시 false 반환. */
  deduct: (amount: number, reason: string) => boolean;
}

let counter = 0;

export const useCreditsStore = create<CreditsState>()(
  persist(
    (set, get) => ({
      balance: INITIAL_BALANCE,
      transactions: INITIAL_TRANSACTIONS,

      charge: (amount) => {
        counter++;
        const newBalance = get().balance + amount;
        const tx: CreditTransaction = {
          id: `tx-user-${Date.now()}-${counter}`,
          date: new Date().toISOString().slice(0, 10),
          reason: '크레딧 충전',
          amount,
          balance: newBalance,
        };
        set(s => ({ balance: newBalance, transactions: [tx, ...s.transactions] }));
      },

      deduct: (amount, reason) => {
        const current = get().balance;
        if (current < amount) return false;
        counter++;
        const newBalance = current - amount;
        const tx: CreditTransaction = {
          id: `tx-user-${Date.now()}-${counter}`,
          date: new Date().toISOString().slice(0, 10),
          reason,
          amount: -amount,
          balance: newBalance,
        };
        set(s => ({ balance: newBalance, transactions: [tx, ...s.transactions] }));
        return true;
      },
    }),
    { name: 'po-credits' },
  ),
);

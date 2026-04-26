/**
 * Partner 크레딧 API 클라이언트.
 * BE PR #22 — GET /credits/me + GET /credits/transactions.
 */
import { request } from './client';

const BASE = '/api/v1/credits';

export type CreditReasonRaw =
  | 'purchase'
  | 'refund'
  | 'proposal_send'
  | 'subscription_grant'
  | 'admin_adjust';

export interface CreditBalanceWire {
  balance: number;
  /** ISO 문자열 (서버에서 Date 직렬화). */
  updatedAt: string;
}

export interface CreditTransactionWire {
  id: string;
  amount: number;
  reason: CreditReasonRaw;
  referenceId: string | null;
  balanceAfter: number;
  createdAt: string;
}

export interface CreditTransactionListWire {
  transactions: CreditTransactionWire[];
  total: number;
}

export const creditsApi = {
  getMyBalance: (): Promise<CreditBalanceWire> => request<CreditBalanceWire>(`${BASE}/me`),
  listMyTransactions: (): Promise<CreditTransactionListWire> =>
    request<CreditTransactionListWire>(`${BASE}/transactions`),
};

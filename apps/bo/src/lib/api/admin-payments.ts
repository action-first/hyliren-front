/**
 * Admin Payments API client — direct backend 호출 (BFF 미경유).
 * BE: hyliren-api/apps/admin → GET /admin/payments (orders 테이블, 최근 1000건)
 */
import { request } from './client';

export type PaymentType = 'report' | 'service';
export type PaymentStatus = 'pending' | 'paid' | 'cancelled' | 'refunded';

export interface AdminPaymentListItem {
  id: string;
  type: PaymentType;
  status: PaymentStatus;
  amount: number;
  currency: string;
  actorId: string;
  actorName: string | null;
  paidAt: string | null;
  createdAt: string;
}

export async function listPayments(): Promise<AdminPaymentListItem[]> {
  return request<AdminPaymentListItem[]>('/payments', { method: 'GET' });
}

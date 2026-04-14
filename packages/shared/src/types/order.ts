import type { OrderStatus, ReportType, ServiceType } from '../constants';

// --- Base Order ---

interface OrderBase {
  id: string;
  userId: string;
  concernId: string;
  status: OrderStatus;
  price: number;          // KRW 원, 주문 시점 확정 스냅샷
  currency: 'KRW';
  paidAt: string | null;
  createdAt: string;
  updatedAt: string;
}

// --- Report Order (Discriminated Union) ---

export interface ReportOrderDetails {
  orderId: string;
  concernId: string;
  targetProposalId: string | null;
  reportType: ReportType;
  overtreatmentScore: number | null;
  priceFairnessScore: number | null;
  riskScore: number | null;
  summary: string | null;
  fullReportUrl: string | null;
  deliveredAt: string | null;
}

export interface ReportOrder extends OrderBase {
  type: 'report';
  details: ReportOrderDetails;
}

// --- Service Order (Discriminated Union) ---

export interface ServiceOrderDetails {
  orderId: string;
  serviceType: ServiceType;
  serviceDate: string | null;
  notes: string | null;
  confirmedAt: string | null;
  completedAt: string | null;
}

export interface ServiceOrder extends OrderBase {
  type: 'service';
  details: ServiceOrderDetails;
}

// --- Order = Discriminated Union (Rule 3) ---

export type Order = ReportOrder | ServiceOrder;

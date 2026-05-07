/**
 * Admin Dashboard API client — direct backend 호출 (BFF 미경유).
 *
 * BE: hyliren-api/apps/admin → GET /admin/dashboard/summary
 */
import { request } from './client';

export interface AdminDashboardKpi {
  buyerCount: number;
  partnerCount: number;
  concernCount: number;
  proposalCount: number;
  totalRevenue: number;
  viewRate: number;
  selectRate: number;
}

export interface AdminDashboardFunnelStep {
  label: string;
  value: number;
}

export interface AdminDashboardConcernStatusItem {
  name: string;
  value: number;
  status: string;
}

export interface AdminDashboardProposalStatusItem {
  name: string;
  value: number;
  status: string;
}

export interface AdminDashboardAreaItem {
  name: string;
  value: number;
}

export interface AdminDashboardEventItem {
  id: string;
  eventType: string;
  timestamp: string;
}

export interface AdminDashboardSummary {
  kpi: AdminDashboardKpi;
  funnel: AdminDashboardFunnelStep[];
  concernStatusPie: AdminDashboardConcernStatusItem[];
  proposalStatusBar: AdminDashboardProposalStatusItem[];
  bodyAreaDistribution: AdminDashboardAreaItem[];
  recentEvents: AdminDashboardEventItem[];
}

export async function getDashboardSummary(): Promise<AdminDashboardSummary> {
  return request<AdminDashboardSummary>('/dashboard/summary', { method: 'GET' });
}

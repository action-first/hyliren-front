import { create } from 'zustand';

/* ── Report Data Models ── */

export interface ReportPreview {
  proposalId: string;
  hospitalName: string;
  priceAdequacy: 'low' | 'fair' | 'high';
  riskLevel: 'low' | 'medium' | 'high';
  overtreatment: 'none' | 'suspected' | 'likely';
  summary: string;
}

export interface PriceBreakdown {
  itemName: string;
  proposalPrice: number;
  marketAvg: number;
  marketRange: [number, number];
  verdict: 'below' | 'fair' | 'above';
}

export interface RiskItem {
  procedure: string;
  riskLevel: 'low' | 'medium' | 'high';
  description: string;
  recoveryDays: string;
  frequency: string;
}

export interface FullReport {
  proposalId: string;
  hospitalName: string;

  /** 가격 적정성 */
  priceScore: number; // 0-100
  priceVerdict: string;
  priceBreakdown: PriceBreakdown[];

  /** 과잉진료 검증 */
  overtreatmentVerdict: string;
  unnecessaryItems: string[];
  necessaryItems: string[];

  /** 리스크 평가 */
  overallRisk: 'low' | 'medium' | 'high';
  riskItems: RiskItem[];

  /** 종합 의견 */
  conclusion: string;
  disclaimer: string;
}

/* ── Store ── */

interface ReportState {
  activeProposalId: string | null;
  preview: ReportPreview | null;
  fullReport: FullReport | null;
  isPaywallOpen: boolean;
  purchasedIds: Set<string>;

  setActiveProposal: (id: string | null) => void;
  setPreview: (preview: ReportPreview | null) => void;
  setFullReport: (report: FullReport | null) => void;
  openPaywall: () => void;
  closePaywall: () => void;
  markPurchased: (proposalId: string) => void;
  isPurchased: (proposalId: string) => boolean;
}

export const useReportStore = create<ReportState>((set, get) => ({
  activeProposalId: null,
  preview: null,
  fullReport: null,
  isPaywallOpen: false,
  purchasedIds: new Set(),

  setActiveProposal: (activeProposalId) => set({ activeProposalId }),
  setPreview: (preview) => set({ preview }),
  setFullReport: (fullReport) => set({ fullReport }),
  openPaywall: () => set({ isPaywallOpen: true }),
  closePaywall: () => set({ isPaywallOpen: false }),
  markPurchased: (proposalId) => set((s) => {
    const next = new Set(s.purchasedIds);
    next.add(proposalId);
    return { purchasedIds: next, isPaywallOpen: false };
  }),
  isPurchased: (proposalId) => get().purchasedIds.has(proposalId),
}));

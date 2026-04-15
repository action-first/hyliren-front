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
  priceScore: number;
  priceVerdict: string;
  priceBreakdown: PriceBreakdown[];
  overtreatmentVerdict: string;
  unnecessaryItems: string[];
  necessaryItems: string[];
  overallRisk: 'low' | 'medium' | 'high';
  riskItems: RiskItem[];
  conclusion: string;
  disclaimer: string;
}

/* ── Store ── */

interface ReportState {
  preview: ReportPreview | null;
  fullReport: FullReport | null;
  purchasedIds: Set<string>;

  setPreview: (preview: ReportPreview | null) => void;
  setFullReport: (report: FullReport | null) => void;
  markPurchased: (id: string) => void;
  isPurchased: (id: string) => boolean;
}

export const useReportStore = create<ReportState>((set, get) => ({
  preview: null,
  fullReport: null,
  purchasedIds: new Set(),

  setPreview: (preview) => set({ preview }),
  setFullReport: (fullReport) => set({ fullReport }),
  markPurchased: (id) => set((s) => {
    const next = new Set(s.purchasedIds);
    next.add(id);
    return { purchasedIds: next };
  }),
  isPurchased: (id) => get().purchasedIds.has(id),
}));

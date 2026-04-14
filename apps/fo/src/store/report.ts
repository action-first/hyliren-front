import { create } from 'zustand';

export interface ReportPreview {
  proposalId: string;
  hospitalName: string;
  priceAdequacy: 'low' | 'fair' | 'high';
  riskLevel: 'low' | 'medium' | 'high';
  overtreatment: 'none' | 'suspected' | 'likely';
  summary: string;
}

interface ReportState {
  /** Currently viewing proposal detail */
  activeProposalId: string | null;
  /** Preview data (free partial) */
  preview: ReportPreview | null;
  /** Whether paywall sheet is open */
  isPaywallOpen: boolean;
  /** Purchased report IDs */
  purchasedIds: Set<string>;

  setActiveProposal: (id: string | null) => void;
  setPreview: (preview: ReportPreview | null) => void;
  openPaywall: () => void;
  closePaywall: () => void;
  markPurchased: (proposalId: string) => void;
  isPurchased: (proposalId: string) => boolean;
}

export const useReportStore = create<ReportState>((set, get) => ({
  activeProposalId: null,
  preview: null,
  isPaywallOpen: false,
  purchasedIds: new Set(),

  setActiveProposal: (activeProposalId) => set({ activeProposalId }),
  setPreview: (preview) => set({ preview }),
  openPaywall: () => set({ isPaywallOpen: true }),
  closePaywall: () => set({ isPaywallOpen: false }),
  markPurchased: (proposalId) => set((s) => {
    const next = new Set(s.purchasedIds);
    next.add(proposalId);
    return { purchasedIds: next, isPaywallOpen: false };
  }),
  isPurchased: (proposalId) => get().purchasedIds.has(proposalId),
}));

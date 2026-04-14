import { create } from 'zustand';

interface DecisionState {
  selectedProposalIds: Set<string>;
  toggleSelect: (id: string) => void;
  clearSelection: () => void;
}

export const useDecisionStore = create<DecisionState>((set) => ({
  selectedProposalIds: new Set<string>(),
  toggleSelect: (id) => set((s) => {
    const next = new Set(s.selectedProposalIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    return { selectedProposalIds: next };
  }),
  clearSelection: () => set({ selectedProposalIds: new Set() }),
}));

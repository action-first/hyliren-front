import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface DecisionState {
  selectedProposalIds: Set<string>;
  /** 최종 선택된 병원(제안서) ID */
  selectedHospitalId: string | null;
  toggleSelect: (id: string) => void;
  clearSelection: () => void;
  selectHospital: (proposalId: string) => void;
}

export const useDecisionStore = create<DecisionState>()(
  persist(
    (set) => ({
      selectedProposalIds: new Set<string>(),
      selectedHospitalId: null,

      toggleSelect: (id) => set((s) => {
        const next = new Set(s.selectedProposalIds);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        return { selectedProposalIds: next };
      }),
      clearSelection: () => set({ selectedProposalIds: new Set() }),
      selectHospital: (proposalId) => set({ selectedHospitalId: proposalId }),
    }),
    {
      name: 'hyliren-decision',
      storage: {
        getItem: (name) => {
          const raw = localStorage.getItem(name);
          if (!raw) return null;
          const parsed = JSON.parse(raw);
          if (parsed?.state?.selectedProposalIds) {
            parsed.state.selectedProposalIds = new Set(parsed.state.selectedProposalIds);
          }
          return parsed;
        },
        setItem: (name, value) => {
          const serializable = {
            ...value,
            state: {
              ...value.state,
              selectedProposalIds: Array.from(value.state.selectedProposalIds),
            },
          };
          localStorage.setItem(name, JSON.stringify(serializable));
        },
        removeItem: (name) => localStorage.removeItem(name),
      },
    },
  ),
);

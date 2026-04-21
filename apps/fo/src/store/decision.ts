import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { onLogout } from '@/store/auth';
import { selectHospital as apiSelectHospital } from '@/lib/api/proposal';

interface DecisionState {
  selectedProposalIds: Set<string>;
  /** 최종 선택된 병원(제안서) ID */
  selectedHospitalId: string | null;
  toggleSelect: (id: string) => void;
  clearSelection: () => void;
  /** concernId와 함께 API를 호출하고 로컬 상태도 업데이트 */
  selectHospital: (concernId: string, proposalId: string) => Promise<void>;
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
      clearSelection: () => set({ selectedProposalIds: new Set(), selectedHospitalId: null }),
      selectHospital: async (concernId, proposalId) => {
        await apiSelectHospital(concernId, proposalId);
        set({ selectedHospitalId: proposalId });
      },
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

// 로그아웃 시 선택 상태 초기화
onLogout(() => useDecisionStore.getState().clearSelection());

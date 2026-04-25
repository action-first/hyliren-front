import { create } from 'zustand';
import type { AnalysisResponse, FeedbackTurn } from '@/server/concern-analysis/types';

/* ══════════════════════════════════════
   Concern Flow Store
   Source of truth: modules/concern-analysis/types.ts
   Store shape: flat API response
   ══════════════════════════════════════ */

export type ConversationStep =
  | 'narrative'
  | 'budget'
  | 'visit-plan'
  | 'processing'
  | 'review'
  | 'feedback'
  | 'confirm'
  | 'submitted';

export type BudgetRange = 'under100' | '100to300' | '300to500' | 'over500' | 'undecided';
export type VisitTiming = 'within1m' | 'within3m' | 'within6m' | 'undecided';
export type StayDuration = 'under3d' | '5to7d' | '2weeks' | 'undecided';

export const BUDGET_LABELS: Record<BudgetRange, string> = {
  under100: '100만원 이하',
  '100to300': '100~300만원',
  '300to500': '300~500만원',
  over500: '500만원 이상',
  undecided: '아직 미정',
};

export const VISIT_TIMING_LABELS: Record<VisitTiming, string> = {
  within1m: '1개월 내',
  within3m: '3개월 내',
  within6m: '6개월 내',
  undecided: '아직 미정',
};

export const STAY_DURATION_LABELS: Record<StayDuration, string> = {
  under3d: '3일 이내',
  '5to7d': '5~7일',
  '2weeks': '2주 정도',
  undecided: '아직 미정',
};

interface ConcernFlowState {
  step: ConversationStep;

  /* Step 1: 부위 */
  selectedBodyArea: string;
  bodyAreaDetail: string;

  /* Step 2: 고민 + 사진 */
  photos: string[];
  narrativeInput: string;

  /* Step 3: 예산 */
  budgetRange: BudgetRange | null;

  /* Step 4: 방문 계획 */
  visitTiming: VisitTiming | null;
  stayDuration: StayDuration | null;

  /** API response — single flat object */
  analysisResult: AnalysisResponse | null;

  feedbackInput: string;
  feedbackTurns: FeedbackTurn[];
  analysisCount: number;

  setStep: (step: ConversationStep) => void;
  setSelectedBodyArea: (area: string) => void;
  setBodyAreaDetail: (detail: string) => void;
  setPhotos: (photos: string[]) => void;
  addPhoto: (url: string) => void;
  removePhoto: (index: number) => void;
  setNarrativeInput: (value: string) => void;
  setBudgetRange: (range: BudgetRange) => void;
  setVisitTiming: (timing: VisitTiming) => void;
  setStayDuration: (duration: StayDuration) => void;
  setAnalysisResult: (result: AnalysisResponse) => void;
  setFeedbackInput: (value: string) => void;
  addFeedbackTurn: (turn: FeedbackTurn) => void;
  incrementAnalysis: () => void;
  resetFlow: () => void;
}

export const useConcernFlowStore = create<ConcernFlowState>((set) => ({
  step: 'narrative',
  selectedBodyArea: '',
  bodyAreaDetail: '',
  photos: [],
  narrativeInput: '',
  budgetRange: null,
  visitTiming: null,
  stayDuration: null,
  analysisResult: null,
  feedbackInput: '',
  feedbackTurns: [],
  analysisCount: 0,

  setStep: (step) => set({ step }),
  setSelectedBodyArea: (selectedBodyArea) => set({ selectedBodyArea }),
  setBodyAreaDetail: (bodyAreaDetail) => set({ bodyAreaDetail }),
  setPhotos: (photos) => set({ photos }),
  addPhoto: (url) => set((s) => ({ photos: [...s.photos, url].slice(0, 3) })),
  removePhoto: (index) => set((s) => ({ photos: s.photos.filter((_, i) => i !== index) })),
  setNarrativeInput: (narrativeInput) => set({ narrativeInput }),
  setBudgetRange: (budgetRange) => set({ budgetRange }),
  setVisitTiming: (visitTiming) => set({ visitTiming }),
  setStayDuration: (stayDuration) => set({ stayDuration }),
  setAnalysisResult: (analysisResult) => set({ analysisResult }),
  setFeedbackInput: (feedbackInput) => set({ feedbackInput }),
  addFeedbackTurn: (turn) => set((s) => ({ feedbackTurns: [...s.feedbackTurns, turn] })),
  incrementAnalysis: () => set((s) => ({ analysisCount: s.analysisCount + 1 })),
  resetFlow: () => set({
    step: 'narrative',
    selectedBodyArea: '',
    bodyAreaDetail: '',
    photos: [],
    narrativeInput: '',
    budgetRange: null,
    visitTiming: null,
    stayDuration: null,
    analysisResult: null,
    feedbackInput: '',
    feedbackTurns: [],
    analysisCount: 0,
  }),
}));

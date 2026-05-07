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

/**
 * 라벨 표시는 i18n key 로 — 컴포넌트가 t(`consult.budget.${range}`) 등으로 매핑.
 * 사용 예시:
 *   <span>{t(`consult.budget.${range}`)}</span>
 *
 * 메시지 키 (4-locale):
 *   consult.budget.{under100|100to300|300to500|over500|undecided}
 *   consult.visit.{within1m|within3m|within6m|undecided}
 *   consult.stay.{under3d|5to7d|2weeks|undecided}
 */
export const BUDGET_LABEL_KEYS: Record<BudgetRange, string> = {
  under100: 'consult.budget.under100',
  '100to300': 'consult.budget.100to300',
  '300to500': 'consult.budget.300to500',
  over500: 'consult.budget.over500',
  undecided: 'consult.budget.undecided',
};

export const VISIT_TIMING_LABEL_KEYS: Record<VisitTiming, string> = {
  within1m: 'consult.visit.within1m',
  within3m: 'consult.visit.within3m',
  within6m: 'consult.visit.within6m',
  undecided: 'consult.visit.undecided',
};

export const STAY_DURATION_LABEL_KEYS: Record<StayDuration, string> = {
  under3d: 'consult.stay.under3d',
  '5to7d': 'consult.stay.5to7d',
  '2weeks': 'consult.stay.2weeks',
  undecided: 'consult.stay.undecided',
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

  /**
   * Backend 에 생성된 concern id (DRAFT 상태). StepAIProcessing 진입 시 createConcern
   * 호출로 받음. StepFeedback / StepConfirm 에서 후속 endpoint 호출 시 사용.
   */
  currentConcernId: string | null;

  /** API response — single flat object */
  analysisResult: AnalysisResponse | null;

  feedbackInput: string;
  feedbackTurns: FeedbackTurn[];
  analysisCount: number;

  setStep: (step: ConversationStep) => void;
  setCurrentConcernId: (id: string | null) => void;
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
  currentConcernId: null,
  analysisResult: null,
  feedbackInput: '',
  feedbackTurns: [],
  analysisCount: 0,

  setStep: (step) => set({ step }),
  setCurrentConcernId: (currentConcernId) => set({ currentConcernId }),
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
    currentConcernId: null,
    analysisResult: null,
    feedbackInput: '',
    feedbackTurns: [],
    analysisCount: 0,
  }),
}));

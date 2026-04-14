import { create } from 'zustand';
import type { AnalysisResponse, FeedbackTurn } from '@/modules/concern-analysis/types';

/* ══════════════════════════════════════
   Concern Flow Store
   Source of truth: modules/concern-analysis/types.ts
   Store shape: flat API response
   ══════════════════════════════════════ */

export type ConversationStep =
  | 'narrative'
  | 'processing'
  | 'review'
  | 'feedback'
  | 'confirm'
  | 'submitted';

interface ConcernFlowState {
  step: ConversationStep;

  photos: string[];
  narrativeInput: string;

  /** API response — single flat object */
  analysisResult: AnalysisResponse | null;

  feedbackInput: string;
  feedbackTurns: FeedbackTurn[];
  analysisCount: number;

  setStep: (step: ConversationStep) => void;
  setPhotos: (photos: string[]) => void;
  addPhoto: (url: string) => void;
  removePhoto: (index: number) => void;
  setNarrativeInput: (value: string) => void;
  setAnalysisResult: (result: AnalysisResponse) => void;
  setFeedbackInput: (value: string) => void;
  addFeedbackTurn: (turn: FeedbackTurn) => void;
  incrementAnalysis: () => void;
  resetFlow: () => void;
}

export const useConcernFlowStore = create<ConcernFlowState>((set) => ({
  step: 'narrative',
  photos: [],
  narrativeInput: '',
  analysisResult: null,
  feedbackInput: '',
  feedbackTurns: [],
  analysisCount: 0,

  setStep: (step) => set({ step }),
  setPhotos: (photos) => set({ photos }),
  addPhoto: (url) => set((s) => ({ photos: [...s.photos, url].slice(0, 3) })),
  removePhoto: (index) => set((s) => ({ photos: s.photos.filter((_, i) => i !== index) })),
  setNarrativeInput: (narrativeInput) => set({ narrativeInput }),
  setAnalysisResult: (analysisResult) => set({ analysisResult }),
  setFeedbackInput: (feedbackInput) => set({ feedbackInput }),
  addFeedbackTurn: (turn) => set((s) => ({ feedbackTurns: [...s.feedbackTurns, turn] })),
  incrementAnalysis: () => set((s) => ({ analysisCount: s.analysisCount + 1 })),
  resetFlow: () => set({
    step: 'narrative',
    photos: [],
    narrativeInput: '',
    analysisResult: null,
    feedbackInput: '',
    feedbackTurns: [],
    analysisCount: 0,
  }),
}));

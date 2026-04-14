import { create } from 'zustand';

export interface AISummary {
  bodyArea: string;
  bodyAreaDetail: string;
  intent: string;
  budgetEstimate: number | null;
  riskPreference: string;
  keywords: string[];
}

interface ConsultState {
  /** Current step: 0=photos, 1=chat, 2=summary, 3=submitting */
  step: number;
  photos: string[];
  message: string;
  aiSummary: AISummary | null;
  isAnalyzing: boolean;
  isSubmitting: boolean;

  setStep: (step: number) => void;
  setPhotos: (photos: string[]) => void;
  addPhoto: (url: string) => void;
  removePhoto: (index: number) => void;
  setMessage: (msg: string) => void;
  setSummary: (summary: AISummary) => void;
  setAnalyzing: (v: boolean) => void;
  setSubmitting: (v: boolean) => void;
  reset: () => void;
}

const initial = {
  step: 0,
  photos: [] as string[],
  message: '',
  aiSummary: null as AISummary | null,
  isAnalyzing: false,
  isSubmitting: false,
};

export const useConsultStore = create<ConsultState>((set) => ({
  ...initial,
  setStep: (step) => set({ step }),
  setPhotos: (photos) => set({ photos }),
  addPhoto: (url) => set((s) => ({ photos: [...s.photos, url].slice(0, 3) })),
  removePhoto: (index) => set((s) => ({ photos: s.photos.filter((_, i) => i !== index) })),
  setMessage: (message) => set({ message }),
  setSummary: (aiSummary) => set({ aiSummary }),
  setAnalyzing: (isAnalyzing) => set({ isAnalyzing }),
  setSubmitting: (isSubmitting) => set({ isSubmitting }),
  reset: () => set(initial),
}));

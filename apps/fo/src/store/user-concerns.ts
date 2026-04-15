import { create } from 'zustand';
import type { Concern, BodyArea } from '@hyliren/shared';
import type { AnalysisResponse } from '@/server/concern-analysis/types';

interface UserConcernsState {
  /** User-created concerns (not from MOCK_CONCERNS) */
  concerns: Concern[];
  /** Add a concern from the consult flow analysis result */
  addFromAnalysis: (analysis: AnalysisResponse, narrative: string, photos: string[]) => Concern;
}

let counter = 0;

export const useUserConcernsStore = create<UserConcernsState>((set, get) => ({
  concerns: [],

  addFromAnalysis: (analysis, narrative, photos) => {
    counter++;
    const now = new Date().toISOString();
    const bodyAreas = (analysis.extractedSummary.bodyAreas || ['기타']) as BodyArea[];
    const primaryArea = (analysis.extractedSummary.primaryArea || bodyAreas[0]) as BodyArea;

    const concern: Concern = {
      id: `c-user-${Date.now()}-${counter}`,
      userId: 'u-001',
      status: 'submitted',
      source: 'organic',
      bodyAreas,
      primaryArea,
      bodyArea: primaryArea,
      bodyAreaDetail: analysis.extractedSummary.bodyAreaDetail || null,
      description: narrative.slice(0, 200),
      budgetMin: analysis.extractedTags.budget?.[0] ? parseInt(analysis.extractedTags.budget[0]) : null,
      budgetMax: analysis.extractedTags.budget?.[1] ? parseInt(analysis.extractedTags.budget[1]) : null,
      visitDateFrom: analysis.extractedTags.timing?.[0] || null,
      visitDateTo: null,
      hasPassport: true,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    };

    set(s => ({ concerns: [...s.concerns, concern] }));
    return concern;
  },
}));

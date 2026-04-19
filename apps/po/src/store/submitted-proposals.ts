'use client';

import { create } from 'zustand';
import type { Proposal, ProposalItem, AnesthesiaType } from '@hyliren/shared';

export interface SubmittedProposalItem {
  name: string;
  nameZh: string;
  price: number;
}

export interface SubmittedProposal extends Omit<Proposal, 'qualityScore' | 'isFlagged'> {
  items: SubmittedProposalItem[];
}

interface SubmitInput {
  concernId: string;
  memberId: string;
  items: SubmittedProposalItem[];
  totalPrice: number;
  recoveryDays: number;
  anesthesiaType: AnesthesiaType;
  hospitalStayDays: number;
  availableDateFrom: string | null;
  availableDateTo: string | null;
  consultationNote: string | null;
  creditsCharged: number;
}

interface SubmittedProposalsState {
  proposals: SubmittedProposal[];
  submit: (input: SubmitInput) => SubmittedProposal;
}

let counter = 0;

export const useSubmittedProposalsStore = create<SubmittedProposalsState>((set) => ({
  proposals: [],

  submit: (input) => {
    counter++;
    const now = new Date().toISOString();
    const proposal: SubmittedProposal = {
      id: `p-user-${Date.now()}-${counter}`,
      version: 1,
      isActive: true,
      status: 'sent',
      sentAt: now,
      viewedAt: null,
      deletedAt: null,
      createdAt: now,
      updatedAt: now,
      ...input,
    };
    set(s => ({ proposals: [proposal, ...s.proposals] }));
    return proposal;
  },
}));

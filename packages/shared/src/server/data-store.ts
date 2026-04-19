/**
 * 공유 데이터 스토어 — 인메모리 (서버 전용)
 *
 * 프로토타입용. 서버 재시작 시 mock 데이터로 리셋됨.
 * 나중에 이 인터페이스만 PostgreSQL/Supabase로 교체하면 됨.
 * API Route에서만 import할 것 (클라이언트 번들에 포함 금지).
 */
import type { Concern, ConcernPhoto, Proposal, ProposalItem } from '../types';
import { MOCK_CONCERNS, MOCK_CONCERN_PHOTOS } from '../mock/concerns';
import { MOCK_PROPOSALS, MOCK_PROPOSAL_ITEMS } from '../mock/proposals';

// 인메모리 저장소 — 서버 프로세스 시작 시 mock에서 seed, 재시작하면 리셋
const store = {
  concerns: [...MOCK_CONCERNS] as Concern[],
  concernPhotos: [...MOCK_CONCERN_PHOTOS] as ConcernPhoto[],
  proposals: [...MOCK_PROPOSALS] as Proposal[],
  proposalItems: [...MOCK_PROPOSAL_ITEMS] as ProposalItem[],
};

// ---- Concerns ----

export function getConcerns(): Concern[] {
  return store.concerns;
}

export function getConcernById(id: string): Concern | null {
  return store.concerns.find(c => c.id === id) ?? null;
}

export function addConcern(concern: Concern): void {
  store.concerns.push(concern);
}

export function getConcernPhotos(): ConcernPhoto[] {
  return store.concernPhotos;
}

// ---- Proposals ----

export function getProposals(): Proposal[] {
  return store.proposals;
}

export function getProposalById(id: string): Proposal | null {
  return store.proposals.find(p => p.id === id) ?? null;
}

export function addProposal(proposal: Proposal): void {
  store.proposals.push(proposal);
}

export function updateProposal(id: string, updates: Partial<Proposal>): Proposal | null {
  const idx = store.proposals.findIndex(p => p.id === id);
  if (idx === -1) return null;
  store.proposals[idx] = { ...store.proposals[idx], ...updates };
  return store.proposals[idx];
}

// ---- Proposal Items ----

export function getProposalItems(): ProposalItem[] {
  return store.proposalItems;
}

export function addProposalItems(items: ProposalItem[]): void {
  store.proposalItems.push(...items);
}

// ---- Events ----

export interface TrackEvent {
  id: string;
  eventType: string;
  actorType: string;
  targetType?: string;
  targetId?: string;
  metadata?: Record<string, string>;
  timestamp: string;
}

const events: TrackEvent[] = [];

export function getEvents(): TrackEvent[] {
  return events;
}

export function addEvent(event: Omit<TrackEvent, 'id' | 'timestamp'>): TrackEvent {
  const entry: TrackEvent = {
    ...event,
    id: `ev-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    timestamp: new Date().toISOString(),
  };
  events.unshift(entry); // 최신이 위
  if (events.length > 500) events.length = 500; // 메모리 제한
  return entry;
}

// ---- Payments ----

export interface Payment {
  id: string;
  type: 'credit_charge' | 'report_purchase' | 'service_purchase';
  amount: number;
  currency: string;
  actorType: 'buyer' | 'partner';
  actorId: string;
  actorName?: string;
  relatedId?: string;
  status: 'paid' | 'pending' | 'refunded';
  timestamp: string;
}

const payments: Payment[] = [];

export function getPayments(): Payment[] {
  return payments;
}

export function addPayment(payment: Omit<Payment, 'id' | 'timestamp'>): Payment {
  const entry: Payment = {
    ...payment,
    id: `pay-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    timestamp: new Date().toISOString(),
  };
  payments.unshift(entry);
  return entry;
}

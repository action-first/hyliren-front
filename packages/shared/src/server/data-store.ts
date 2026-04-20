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

const SEED_EVENTS: TrackEvent[] = [
  { id: 'ev-seed-01', eventType: 'concern_submit', actorType: 'user', targetType: 'concern', targetId: 'c-001', timestamp: '2026-04-18T14:30:00Z' },
  { id: 'ev-seed-02', eventType: 'proposal_send', actorType: 'partner', targetType: 'proposal', targetId: 'p-001', timestamp: '2026-04-18T15:00:00Z' },
  { id: 'ev-seed-03', eventType: 'proposal_view', actorType: 'user', targetType: 'proposal', targetId: 'p-001', timestamp: '2026-04-18T16:20:00Z' },
  { id: 'ev-seed-04', eventType: 'page_view', actorType: 'user', metadata: { page: '/articles' }, timestamp: '2026-04-18T17:00:00Z' },
  { id: 'ev-seed-05', eventType: 'concern_submit', actorType: 'user', targetType: 'concern', targetId: 'c-005', timestamp: '2026-04-17T10:00:00Z' },
  { id: 'ev-seed-06', eventType: 'proposal_send', actorType: 'partner', targetType: 'proposal', targetId: 'p-002', timestamp: '2026-04-17T11:30:00Z' },
  { id: 'ev-seed-07', eventType: 'report_purchase', actorType: 'user', targetType: 'order', targetId: 'o-001', timestamp: '2026-04-16T09:00:00Z' },
  { id: 'ev-seed-08', eventType: 'page_view', actorType: 'user', metadata: { page: '/consult' }, timestamp: '2026-04-16T08:30:00Z' },
];
const events: TrackEvent[] = [...SEED_EVENTS];

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

const SEED_PAYMENTS: Payment[] = [
  { id: 'pay-seed-01', type: 'credit_charge', amount: 80000, currency: 'KRW', actorType: 'partner', actorId: 'm-001', actorName: '강남아이 성형외과', status: 'paid', timestamp: '2026-04-10T09:00:00Z' },
  { id: 'pay-seed-02', type: 'report_purchase', amount: 150000, currency: 'KRW', actorType: 'buyer', actorId: 'u-001', actorName: '리리', relatedId: 'o-001', status: 'paid', timestamp: '2026-04-12T14:00:00Z' },
  { id: 'pay-seed-03', type: 'service_purchase', amount: 350000, currency: 'KRW', actorType: 'buyer', actorId: 'u-002', actorName: '메이', relatedId: 'o-002', status: 'paid', timestamp: '2026-04-11T16:00:00Z' },
  { id: 'pay-seed-04', type: 'credit_charge', amount: 120000, currency: 'KRW', actorType: 'partner', actorId: 'm-002', actorName: '에스라인 클리닉', status: 'paid', timestamp: '2026-04-08T11:00:00Z' },
  { id: 'pay-seed-05', type: 'report_purchase', amount: 200000, currency: 'KRW', actorType: 'buyer', actorId: 'u-001', actorName: '리리', relatedId: 'o-003', status: 'paid', timestamp: '2026-04-08T10:00:00Z' },
];
const payments: Payment[] = [...SEED_PAYMENTS];

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

/**
 * 공유 데이터 스토어 — JSON 파일 기반 (서버 전용)
 *
 * /tmp/hyliren-store.json 를 공유 저장소로 사용.
 * FO/PO/BO 세 프로세스가 같은 파일을 읽고 쓰므로 크로스 프로세스 데이터 공유 가능.
 * 프로토타입용 — 나중에 이 인터페이스만 PostgreSQL/Supabase로 교체하면 됨.
 * API Route에서만 import할 것 (클라이언트 번들에 포함 금지).
 */
import fs from 'fs';
import type {
  Concern, ConcernPhoto, Proposal, ProposalItem,
  Procedure, ProcedureVariant, ProcedureBookmark,
} from '../types';
import { computePriceRange } from '../domain/procedure';
import type { EventActorType, EventTargetType } from '../constants';
import { MOCK_CONCERNS, MOCK_CONCERN_PHOTOS } from '../mock/concerns';
import { MOCK_PROPOSALS, MOCK_PROPOSAL_ITEMS } from '../mock/proposals';
import {
  MOCK_PROCEDURES, MOCK_PROCEDURE_VARIANTS, MOCK_PROCEDURE_BOOKMARKS,
} from '../mock/procedures';

const STORE_FILE = '/tmp/hyliren-store.json';

type StoreData = {
  concerns: Concern[];
  concernPhotos: ConcernPhoto[];
  proposals: Proposal[];
  proposalItems: ProposalItem[];
  procedures: Procedure[];
  procedureVariants: ProcedureVariant[];
  procedureBookmarks: ProcedureBookmark[];
};

function seed(): StoreData {
  return {
    concerns: [...MOCK_CONCERNS],
    concernPhotos: [...MOCK_CONCERN_PHOTOS],
    proposals: [...MOCK_PROPOSALS],
    proposalItems: [...MOCK_PROPOSAL_ITEMS],
    procedures: [...MOCK_PROCEDURES],
    procedureVariants: [...MOCK_PROCEDURE_VARIANTS],
    procedureBookmarks: [...MOCK_PROCEDURE_BOOKMARKS],
  };
}

function load(): StoreData {
  try {
    const raw = JSON.parse(fs.readFileSync(STORE_FILE, 'utf-8')) as Partial<StoreData>;
    // 기존 스토어에 신설 필드 (procedures 계열) 가 없으면 seed 로 병합.
    // 배포 중 /tmp 파일 리셋 없이 스키마 확장 가능.
    const defaults = seed();
    const merged: StoreData = {
      concerns: raw.concerns ?? defaults.concerns,
      concernPhotos: raw.concernPhotos ?? defaults.concernPhotos,
      proposals: raw.proposals ?? defaults.proposals,
      proposalItems: raw.proposalItems ?? defaults.proposalItems,
      procedures: raw.procedures ?? defaults.procedures,
      procedureVariants: raw.procedureVariants ?? defaults.procedureVariants,
      procedureBookmarks: raw.procedureBookmarks ?? defaults.procedureBookmarks,
    };
    if (
      raw.procedures === undefined ||
      raw.procedureVariants === undefined ||
      raw.procedureBookmarks === undefined
    ) {
      fs.writeFileSync(STORE_FILE, JSON.stringify(merged));
    }
    return merged;
  } catch {
    const data = seed();
    fs.writeFileSync(STORE_FILE, JSON.stringify(data));
    return data;
  }
}

function save(data: StoreData): void {
  fs.writeFileSync(STORE_FILE, JSON.stringify(data));
}

/** mock 데이터로 초기화. 테스트 리셋 시 사용. */
export function resetStore(): void {
  fs.writeFileSync(STORE_FILE, JSON.stringify(seed()));
}

// ---- Concerns ----

export function getConcerns(): Concern[] {
  return load().concerns;
}

export function getConcernById(id: string): Concern | null {
  return load().concerns.find(c => c.id === id) ?? null;
}

export function addConcern(concern: Concern): void {
  const data = load();
  data.concerns.push(concern);
  save(data);
}

export function getConcernPhotos(): ConcernPhoto[] {
  return load().concernPhotos;
}

// ---- Proposals ----

export function getProposals(): Proposal[] {
  return load().proposals;
}

export function getProposalById(id: string): Proposal | null {
  return load().proposals.find(p => p.id === id) ?? null;
}

export function addProposal(proposal: Proposal): void {
  const data = load();
  data.proposals.push(proposal);
  save(data);
}

export function updateConcern(id: string, updates: Partial<Concern>): Concern | null {
  const data = load();
  const idx = data.concerns.findIndex(c => c.id === id);
  if (idx === -1) return null;
  data.concerns[idx] = { ...data.concerns[idx], ...updates };
  save(data);
  return data.concerns[idx];
}

export function updateProposal(id: string, updates: Partial<Proposal>): Proposal | null {
  const data = load();
  const idx = data.proposals.findIndex(p => p.id === id);
  if (idx === -1) return null;
  data.proposals[idx] = { ...data.proposals[idx], ...updates };
  save(data);
  return data.proposals[idx];
}

// ---- Procedures ----

export function getProcedures(): Procedure[] {
  return load().procedures.filter(p => !p.deletedAt);
}

export function getProcedureById(id: string): Procedure | null {
  return load().procedures.find(p => p.id === id && !p.deletedAt) ?? null;
}

export function getProcedureBySlug(slug: string): Procedure | null {
  return load().procedures.find(p => p.slug === slug && !p.deletedAt) ?? null;
}

/**
 * 해당 slug 가 이미 쓰이는지 확인. excludeId 가 주어지면 그 레코드는 제외
 * (자기 자신이 기존에 쓰던 slug 를 유지하는 PATCH 케이스용).
 */
export function isSlugTaken(slug: string, excludeId?: string): boolean {
  return load().procedures.some(
    p => p.slug === slug && !p.deletedAt && p.id !== excludeId,
  );
}

/**
 * slug 에 자동 suffix (-2, -3, ...) 를 붙여 유니크하게 만든다.
 * 이미 유니크하면 원본 반환.
 */
export function ensureUniqueSlug(slug: string, excludeId?: string): string {
  if (!isSlugTaken(slug, excludeId)) return slug;
  for (let i = 2; i < 1000; i++) {
    const candidate = `${slug}-${i}`;
    if (!isSlugTaken(candidate, excludeId)) return candidate;
  }
  // 비정상: 1000개 충돌은 사실상 없음
  return `${slug}-${Date.now()}`;
}

export function addProcedure(
  procedure: Procedure,
  variants: ProcedureVariant[],
): void {
  const data = load();
  data.procedures.push(procedure);
  data.procedureVariants.push(...variants);
  save(data);
}

/**
 * Procedure 부분 업데이트. base* 값이 포함되면 variants 집계 재계산.
 * i18n 은 부분 병합이 필요한 경우 상위 라우트에서 머지 후 이 함수로 전달.
 */
export function updateProcedure(id: string, updates: Partial<Procedure>): Procedure | null {
  const data = load();
  const idx = data.procedures.findIndex(p => p.id === id);
  if (idx === -1) return null;

  const next: Procedure = {
    ...data.procedures[idx],
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  data.procedures[idx] = next;

  // base* 변경 또는 명시 priceMin/priceMax 재산정 트리거
  const basePriceChanged = updates.basePrice !== undefined;
  const priceManualOverride = updates.priceMin !== undefined || updates.priceMax !== undefined;
  if (basePriceChanged && !priceManualOverride) {
    const variants = data.procedureVariants.filter(v => v.procedureId === id);
    const range = computePriceRange(variants, next);
    data.procedures[idx] = { ...next, priceMin: range.priceMin, priceMax: range.priceMax };
  }

  save(data);
  return data.procedures[idx];
}

export function softDeleteProcedure(id: string): Procedure | null {
  return updateProcedure(id, { deletedAt: new Date().toISOString(), status: 'archived' });
}

/** viewCount / consultClickCount / bookmarkCount atomic 증감 */
export function incrementProcedureMetric(
  id: string,
  metric: 'viewCount' | 'consultClickCount' | 'bookmarkCount',
  delta = 1,
): void {
  const data = load();
  const idx = data.procedures.findIndex(p => p.id === id);
  if (idx === -1) return;
  data.procedures[idx] = {
    ...data.procedures[idx],
    [metric]: Math.max(0, data.procedures[idx][metric] + delta),
  };
  save(data);
}

// ---- Procedure Variants ----

export function getProcedureVariants(procedureId: string): ProcedureVariant[] {
  return load().procedureVariants
    .filter(v => v.procedureId === procedureId)
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

export function addProcedureVariant(variant: ProcedureVariant): void {
  const data = load();
  data.procedureVariants.push(variant);
  recalcPriceRange(data, variant.procedureId);
  save(data);
}

export function updateProcedureVariant(
  id: string,
  updates: Partial<Omit<ProcedureVariant, 'id' | 'procedureId'>>,
): ProcedureVariant | null {
  const data = load();
  const idx = data.procedureVariants.findIndex(v => v.id === id);
  if (idx === -1) return null;
  data.procedureVariants[idx] = {
    ...data.procedureVariants[idx],
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  recalcPriceRange(data, data.procedureVariants[idx].procedureId);
  save(data);
  return data.procedureVariants[idx];
}

export function removeProcedureVariant(id: string): void {
  const data = load();
  const variant = data.procedureVariants.find(v => v.id === id);
  if (!variant) return;
  data.procedureVariants = data.procedureVariants.filter(v => v.id !== id);
  recalcPriceRange(data, variant.procedureId);
  save(data);
}

/**
 * variant default 불변식 강제 — procedure 당 isDefault=true 가 정확히 1개가
 * 되도록 조정. 백엔드 (apps/partner) 의 ensureSingleDefault 와 동일 계약.
 *
 * 선택 우선순위:
 *   1. preferredId 존재 + procedure 에 속하면 그것
 *   2. 현재 isDefault=true 가 정확히 1개면 그것 유지
 *   3. 그 외엔 sortOrder 최하
 *
 * variants 0개면 no-op.
 */
export function ensureSingleDefaultVariant(procedureId: string, preferredId?: string): void {
  const data = load();
  const variants = data.procedureVariants.filter(v => v.procedureId === procedureId);
  if (variants.length === 0) return;

  let targetId: string;
  if (preferredId && variants.some(v => v.id === preferredId)) {
    targetId = preferredId;
  } else {
    const currentDefaults = variants.filter(v => v.isDefault);
    if (currentDefaults.length === 1) {
      targetId = currentDefaults[0].id;
    } else {
      const sorted = [...variants].sort((a, b) => a.sortOrder - b.sortOrder);
      targetId = sorted[0].id;
    }
  }

  const now = new Date().toISOString();
  data.procedureVariants = data.procedureVariants.map(v => {
    if (v.procedureId !== procedureId) return v;
    const shouldBeDefault = v.id === targetId;
    if (v.isDefault === shouldBeDefault) return v;
    return { ...v, isDefault: shouldBeDefault, updatedAt: now };
  });
  save(data);
}

function recalcPriceRange(data: StoreData, procedureId: string): void {
  const procIdx = data.procedures.findIndex(p => p.id === procedureId);
  if (procIdx === -1) return;
  const variants = data.procedureVariants.filter(v => v.procedureId === procedureId);
  const range = computePriceRange(variants, data.procedures[procIdx]);
  data.procedures[procIdx] = {
    ...data.procedures[procIdx],
    priceMin: range.priceMin,
    priceMax: range.priceMax,
    updatedAt: new Date().toISOString(),
  };
}

// ---- Procedure Bookmarks ----

export function getProcedureBookmarks(userId: string): ProcedureBookmark[] {
  return load().procedureBookmarks.filter(b => b.userId === userId);
}

export function isProcedureBookmarked(userId: string, procedureId: string): boolean {
  return load().procedureBookmarks.some(b => b.userId === userId && b.procedureId === procedureId);
}

export function addProcedureBookmark(userId: string, procedureId: string): ProcedureBookmark | null {
  const data = load();
  // 중복 방지 (Unique userId + procedureId)
  const existing = data.procedureBookmarks.find(
    b => b.userId === userId && b.procedureId === procedureId,
  );
  if (existing) return existing;

  const bookmark: ProcedureBookmark = {
    id: `pb-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    userId,
    procedureId,
    createdAt: new Date().toISOString(),
  };
  data.procedureBookmarks.push(bookmark);

  const procIdx = data.procedures.findIndex(p => p.id === procedureId);
  if (procIdx !== -1) {
    data.procedures[procIdx] = {
      ...data.procedures[procIdx],
      bookmarkCount: data.procedures[procIdx].bookmarkCount + 1,
    };
  }
  save(data);
  return bookmark;
}

export function removeProcedureBookmark(userId: string, procedureId: string): boolean {
  const data = load();
  const before = data.procedureBookmarks.length;
  data.procedureBookmarks = data.procedureBookmarks.filter(
    b => !(b.userId === userId && b.procedureId === procedureId),
  );
  const removed = before - data.procedureBookmarks.length;
  if (removed === 0) return false;

  const procIdx = data.procedures.findIndex(p => p.id === procedureId);
  if (procIdx !== -1) {
    data.procedures[procIdx] = {
      ...data.procedures[procIdx],
      bookmarkCount: Math.max(0, data.procedures[procIdx].bookmarkCount - 1),
    };
  }
  save(data);
  return true;
}

// ---- Proposal Items ----

export function getProposalItems(): ProposalItem[] {
  return load().proposalItems;
}

export function addProposalItems(items: ProposalItem[]): void {
  const data = load();
  data.proposalItems.push(...items);
  save(data);
}

// ---- Events (인메모리 유지 — 분석용, 크로스 프로세스 공유 불필요) ----

export interface TrackEvent {
  id: string;
  eventType: string;
  // DB event_actor_type ENUM ('user','member','system') 와 일치시킨다.
  // partner/admin 은 members 테이블의 role 로 구분되며 event 주체로서는 모두 'member'.
  actorType: EventActorType;
  targetType?: EventTargetType;
  targetId?: string;
  metadata?: Record<string, string>;
  timestamp: string;
}

// DB ENUM 일치. 이전 'partner' seed 는 'member' 로 교체 (ev-seed-02, ev-seed-06).
const SEED_EVENTS: TrackEvent[] = [
  { id: 'ev-seed-01', eventType: 'concern_submit', actorType: 'user',   targetType: 'concern',  targetId: 'c-001', timestamp: '2026-04-18T14:30:00Z' },
  { id: 'ev-seed-02', eventType: 'proposal_send',  actorType: 'member', targetType: 'proposal', targetId: 'p-001', timestamp: '2026-04-18T15:00:00Z' },
  { id: 'ev-seed-03', eventType: 'proposal_view',  actorType: 'user',   targetType: 'proposal', targetId: 'p-001', timestamp: '2026-04-18T16:20:00Z' },
  { id: 'ev-seed-04', eventType: 'page_view',      actorType: 'user',   metadata: { page: '/articles' }, timestamp: '2026-04-18T17:00:00Z' },
  { id: 'ev-seed-05', eventType: 'concern_submit', actorType: 'user',   targetType: 'concern',  targetId: 'c-005', timestamp: '2026-04-17T10:00:00Z' },
  { id: 'ev-seed-06', eventType: 'proposal_send',  actorType: 'member', targetType: 'proposal', targetId: 'p-002', timestamp: '2026-04-17T11:30:00Z' },
  { id: 'ev-seed-07', eventType: 'report_purchase',actorType: 'user',   targetType: 'order',    targetId: 'o-001', timestamp: '2026-04-16T09:00:00Z' },
  { id: 'ev-seed-08', eventType: 'page_view',      actorType: 'user',   metadata: { page: '/consult' }, timestamp: '2026-04-16T08:30:00Z' },
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
  events.unshift(entry);
  if (events.length > 500) events.length = 500;
  return entry;
}

// ---- Payments (인메모리 유지) ----

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
  { id: 'pay-seed-02', type: 'report_purchase', amount: 150000, currency: 'KRW', actorType: 'buyer', actorId: 'u-001', actorName: '테스트유저', relatedId: 'o-001', status: 'paid', timestamp: '2026-04-12T14:00:00Z' },
  { id: 'pay-seed-04', type: 'credit_charge', amount: 120000, currency: 'KRW', actorType: 'partner', actorId: 'm-002', actorName: '에스라인 클리닉', status: 'paid', timestamp: '2026-04-08T11:00:00Z' },
  { id: 'pay-seed-05', type: 'report_purchase', amount: 200000, currency: 'KRW', actorType: 'buyer', actorId: 'u-001', actorName: '테스트유저', relatedId: 'o-003', status: 'paid', timestamp: '2026-04-08T10:00:00Z' },
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

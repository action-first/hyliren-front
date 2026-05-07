/**
 * Event Tracker — Day 1부터 수집
 *
 * MVP: console.log 만 수행. 백엔드 events endpoint 가 추가되면 이 함수에서
 * direct request<T> 호출로 연결한다 (BFF 경유 금지).
 *
 * metadata 규약:
 * - source 필수 ('fo' | 'po' | 'bo')
 * - locale 은 호출처에서 명시 안 하면 track() 이 source 별 zustand persist 스토리지
 *   (hyliren-locale / po-locale) 에서 자동 주입. SSR 환경이거나 storage 미설정 시
 *   undefined — BE 가 fallback 처리.
 */

import { isLocale, type EventActorType, type EventTargetType, type Locale } from '../constants';

export type EventSource = 'fo' | 'po' | 'bo';

export interface TrackEvent {
  eventType: string;
  actorType: EventActorType;
  actorId?: string;
  targetType?: EventTargetType;
  targetId?: string;
  metadata?: {
    source: EventSource;
    /** 미명시 시 source 별 store 에서 자동 추론. */
    locale?: Locale;
    label?: string;
    value?: string;
    [key: string]: unknown;
  };
}

const STORAGE_KEY_BY_SOURCE: Record<EventSource, string> = {
  fo: 'hyliren-locale',
  po: 'po-locale',
  bo: 'bo-locale', // 미사용 — BO 는 ko-only, 자동 주입 안 됨 (storage 부재)
};

function inferLocale(source: EventSource): Locale | undefined {
  if (typeof window === 'undefined') return undefined;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY_BY_SOURCE[source]);
    if (!raw) return undefined;
    const parsed = JSON.parse(raw) as { state?: { locale?: unknown } };
    const candidate = parsed?.state?.locale;
    return isLocale(candidate) ? candidate : undefined;
  } catch {
    return undefined;
  }
}

const REQUIRED_EVENTS = [
  'signup_completed',
  'concern_submitted',
  'proposal_sent',
  'proposal_viewed',
  'proposal_shortlisted',
  'report_purchased',
  'hospital_selected',
  'service_purchased',
  'article_viewed',
  'article_cta_clicked',
  'compare_entered',
  'report_cta_clicked',
] as const;

export type RequiredEventType = typeof REQUIRED_EVENTS[number];

export function track(event: TrackEvent): void {
  if (typeof window === 'undefined') return;

  // locale 미명시 시 source 별 store 에서 자동 추론.
  const enriched = event.metadata?.source && event.metadata.locale === undefined
    ? { ...event, metadata: { ...event.metadata, locale: inferLocale(event.metadata.source) } }
    : event;

  console.log('[HYLIREN_EVENT]', JSON.stringify({ ...enriched, timestamp: new Date().toISOString() }));
}

export { REQUIRED_EVENTS };

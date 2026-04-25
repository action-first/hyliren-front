/**
 * Event Tracker — Day 1부터 수집
 *
 * MVP: console.log 만 수행. 백엔드 events endpoint 가 추가되면 이 함수에서
 * direct request<T> 호출로 연결한다 (BFF 경유 금지).
 * metadata 규약: { source, locale } 필수
 */

import type { EventActorType, EventTargetType, Locale } from '../constants';

export interface TrackEvent {
  eventType: string;
  actorType: EventActorType;
  actorId?: string;
  targetType?: EventTargetType;
  targetId?: string;
  metadata?: {
    source: 'fo' | 'po' | 'bo';
    locale: Locale;
    label?: string;
    value?: string;
    [key: string]: unknown;
  };
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
  if (typeof window !== 'undefined') {
    console.log('[HYLIREN_EVENT]', JSON.stringify({ ...event, timestamp: new Date().toISOString() }));
  }
}

export { REQUIRED_EVENTS };

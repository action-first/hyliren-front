/**
 * Event Tracker — Day 1부터 수집
 *
 * MVP: console.log로 출력. 나중에 실제 API/analytics로 교체.
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
    // 콘솔 로그
    console.log('[HYLIREN_EVENT]', JSON.stringify({ ...event, timestamp: new Date().toISOString() }));

    // data-store에 이벤트 기록 (fire-and-forget)
    fetch('/api/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        eventType: event.eventType,
        actorType: event.actorType,
        targetType: event.targetType,
        targetId: event.targetId,
        metadata: event.metadata ? Object.fromEntries(Object.entries(event.metadata).map(([k, v]) => [k, String(v)])) : undefined,
      }),
    }).catch(() => {}); // 실패해도 무시
  }
}

export { REQUIRED_EVENTS };

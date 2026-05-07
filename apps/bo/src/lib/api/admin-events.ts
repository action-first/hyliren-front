/**
 * Admin Events API client — direct backend 호출 (BFF 미경유).
 * BE: hyliren-api/apps/admin → GET /admin/events (audit log, 최근 1000건)
 */
import { request } from './client';

export type EventActorType = 'user' | 'member' | 'system';
export type EventTargetType = 'concern' | 'proposal' | 'order' | 'member';

export interface AdminEventListItem {
  id: string;
  eventType: string;
  actorType: EventActorType;
  actorId: string | null;
  targetType: EventTargetType | null;
  targetId: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export async function listEvents(): Promise<AdminEventListItem[]> {
  return request<AdminEventListItem[]>('/events', { method: 'GET' });
}

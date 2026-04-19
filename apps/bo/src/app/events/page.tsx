import { getEvents } from '@hyliren/shared/src/server/data-store';
import { AdminPage } from '@hyliren/ui';
import { BOSidebar } from '@/components/BOSidebar';
import { EventsGrid } from './EventsGrid';

export const dynamic = 'force-dynamic';

export default function EventsPage() {
  const events = getEvents();
  const rows = events.map(ev => ({
    id: ev.id,
    timestamp: new Date(ev.timestamp).toLocaleString('ko'),
    eventType: ev.eventType,
    actorType: ev.actorType,
    target: ev.targetType ? `${ev.targetType} ${ev.targetId || ''}` : '-',
    meta: ev.metadata ? Object.entries(ev.metadata).map(([k, v]) => `${k}=${v}`).join(', ') : '-',
  }));

  return (
    <AdminPage sidebar={<BOSidebar active="/events" />} title="이벤트 로그" prefix="bo">
      <EventsGrid rows={rows} />
    </AdminPage>
  );
}

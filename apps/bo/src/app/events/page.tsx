'use client';

import { useEffect, useState } from 'react';
import { AdminPage, Spinner } from '@hyliren/ui';
import { BOSidebar } from '@/components/BOSidebar';
import { EventsGrid } from './EventsGrid';
import { listEvents, type AdminEventListItem } from '@/lib/api/admin-events';

interface EventRow {
  id: string;
  timestamp: string;
  eventType: string;
  actorType: string;
  target: string;
  meta: string;
}

function toRow(ev: AdminEventListItem): EventRow {
  return {
    id: ev.id,
    timestamp: new Date(ev.createdAt).toLocaleString('ko'),
    eventType: ev.eventType,
    actorType: ev.actorType,
    target: ev.targetType ? `${ev.targetType} ${ev.targetId || ''}` : '-',
    meta: ev.metadata
      ? Object.entries(ev.metadata)
          .map(([k, v]) => `${k}=${typeof v === 'object' ? JSON.stringify(v) : String(v)}`)
          .join(', ') || '-'
      : '-',
  };
}

export default function EventsPage() {
  const [rows, setRows] = useState<EventRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    listEvents()
      .then((items) => { if (!cancelled) setRows(items.map(toRow)); })
      .catch((e: unknown) => {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : '이벤트 로그를 불러오지 못했습니다.');
      });
    return () => { cancelled = true; };
  }, []);

  return (
    <AdminPage sidebar={<BOSidebar active="/events" />} title="이벤트 로그" prefix="bo">
      {error ? (
        <div style={{ padding: 24, color: 'var(--color-danger,#d72c0d)', fontSize: 13 }}>{error}</div>
      ) : rows === null ? (
        <div style={{ minHeight: 240, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Spinner />
        </div>
      ) : (
        <EventsGrid rows={rows} />
      )}
    </AdminPage>
  );
}

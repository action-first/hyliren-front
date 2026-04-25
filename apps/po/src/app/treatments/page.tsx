'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { POSidebar } from '@/components/POSidebar';
import { Card, Button, Badge, SectionHeader, AdminPage, Spinner } from '@hyliren/ui';
import { proceduresApi } from '@/lib/api/procedures';
import { usePOAuthStore } from '@/store/po-auth';
import { useToastStore } from '@/store/toast';
import { pickI18n } from '@hyliren/shared/src/domain/procedure';
import type { Procedure, ProcedureStatus } from '@hyliren/shared';
import { Plus, ImageIcon, Pencil } from 'lucide-react';

type StatusFilter = 'all' | ProcedureStatus;

const STATUS_TABS: { key: StatusFilter; label: string }[] = [
  { key: 'all', label: '전체' },
  { key: 'published', label: '공개' },
  { key: 'draft', label: '임시저장' },
  { key: 'archived', label: '보관함' },
];

const STATUS_KR: Record<ProcedureStatus, string> = {
  draft: '임시저장',
  published: '공개',
  archived: '보관',
};

const STATUS_VARIANT: Record<ProcedureStatus, 'default' | 'success' | 'warning' | 'info'> = {
  draft: 'warning',
  published: 'success',
  archived: 'default',
};

export default function TreatmentsPage() {
  const member = usePOAuthStore(s => s.member);
  const { showToast } = useToastStore();
  const [filter, setFilter] = useState<StatusFilter>('all');
  const [procedures, setProcedures] = useState<Procedure[] | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!member) return;
    setLoading(true);
    try {
      const res = await proceduresApi.list({
        status: filter === 'all' ? undefined : filter,
      });
      setProcedures(res.procedures);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : '목록을 불러올 수 없습니다';
      showToast(msg, 'error');
      setProcedures([]);
    } finally {
      setLoading(false);
    }
  }, [member, filter, showToast]);

  useEffect(() => { void load(); }, [load]);

  return (
    <AdminPage
      sidebar={<POSidebar active="/treatments" />}
      title="시술 관리"
      actions={
        <Link href="/treatments/new">
          <Button variant="accent" size="sm">
            <Plus size={13} /> 새 시술 등록
          </Button>
        </Link>
      }
      prefix="po"
    >
      <SectionHeader title={`등록한 시술 (${procedures?.length ?? 0})`} />

      {/* 상태 필터 탭 */}
      <div className="flex gap-1 mt-3 mb-4 border-b border-[var(--color-border)]">
        {STATUS_TABS.map(tab => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setFilter(tab.key)}
            className={`
              px-3 py-2 text-[12px] font-medium border-b-2 -mb-px transition-colors
              ${filter === tab.key
                ? 'border-[var(--color-primary)] text-[var(--color-text)]'
                : 'border-transparent text-[var(--color-text-dim)] hover:text-[var(--color-text)]'}
            `}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading && (
        <Card padding="md" className="mt-4">
          <div className="flex items-center justify-center py-12"><Spinner /></div>
        </Card>
      )}

      {!loading && procedures?.length === 0 && (
        <Card padding="md" className="mt-4">
          <div className="text-center py-12">
            <p className="text-[13px] text-[var(--color-text-dim)] mb-3">
              {filter === 'all'
                ? '등록된 시술이 없습니다.'
                : `${STATUS_TABS.find(t => t.key === filter)?.label} 상태의 시술이 없습니다.`}
            </p>
            <Link href="/treatments/new">
              <Button variant="accent" size="sm">
                <Plus size={13} /> 첫 시술 등록하기
              </Button>
            </Link>
          </div>
        </Card>
      )}

      {!loading && procedures && procedures.length > 0 && (
        <div className="grid gap-3 mt-1" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
          {procedures.map(p => {
            const pick = pickI18n(p.i18n, 'ko', p.sourceLocale);
            const title = pick?.content.title || '(제목 없음)';
            return (
              <Link key={p.id} href={`/treatments/${p.id}/edit`} className="no-underline">
                <Card padding="none" hoverable>
                  <div className="h-32 bg-[var(--color-bg-tertiary)] flex items-center justify-center overflow-hidden rounded-t-[var(--app-radius)]">
                    {p.heroImageUrl
                      ? <img src={p.heroImageUrl} alt="" className="w-full h-full object-cover" />
                      : <ImageIcon size={28} className="text-[var(--color-text-dim)]" />}
                  </div>
                  <div className="p-3">
                    <div className="flex items-start justify-between mb-1.5">
                      <p className="text-[13px] font-semibold text-[var(--color-text)] mb-0.5 line-clamp-1">
                        {title}
                      </p>
                      <Badge variant={STATUS_VARIANT[p.status]} size="sm">
                        {STATUS_KR[p.status]}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 mb-1.5">
                      <Badge variant="info" size="sm">{p.primaryArea}</Badge>
                      <span className="text-[12px] font-semibold text-[var(--color-text)]">
                        {p.priceMin === p.priceMax
                          ? `${(p.priceMin / 10000).toFixed(0)}만`
                          : `${(p.priceMin / 10000).toFixed(0)}~${(p.priceMax / 10000).toFixed(0)}만`}
                      </span>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-[var(--color-border-light)] text-[11px] text-[var(--color-text-dim)]">
                      <span>조회 {p.viewCount} · 북마크 {p.bookmarkCount}</span>
                      <Pencil size={12} />
                    </div>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </AdminPage>
  );
}

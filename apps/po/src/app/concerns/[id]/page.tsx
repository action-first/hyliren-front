'use client';

import { useCallback, useEffect, useState } from 'react';
import { notFound, useParams, useRouter, useSearchParams } from 'next/navigation';
import {
  BODY_AREA_BADGE,
  CONCERN_STATUS_BADGE,
  formatBudget,
  formatDateKR,
  formatDateRange,
} from '@hyliren/shared';
import { AdminPage, Badge, Button, Card, SectionHeader, Spinner } from '@hyliren/ui';

import { POSidebar } from '@/components/POSidebar';
import { MyProposalSheet } from '@/components/concerns/MyProposalSheet';
import { ProposeFormSheet } from '@/components/concerns/ProposeFormSheet';
import { findMyProposalByConcern, type ProposalDetailWire } from '@/lib/api/proposal';
import { formatKRW } from '@hyliren/shared';
import { getConcern, type ConcernDetailWire } from '@/lib/api/concern';
import { ApiError } from '@/lib/api/errors';
import { useLocaleStore } from '@/store/locale';

// ── 작은 표시 컴포넌트 ──

/** concern.status enum (snake_case) → lifecycle.status i18n key suffix (camelCase). */
const CONCERN_STATUS_I18N_SUFFIX: Record<string, string> = {
  draft: 'draft',
  submitted: 'submitted',
  proposal_received: 'proposalReceived',
  comparing: 'comparing',
  report_purchased: 'reportPurchased',
  hospital_selected: 'hospitalSelected',
  service_purchased: 'servicePurchased',
  completed: 'completed',
  cancelled: 'cancelled',
};

function StatusBadge({ statusKey, label, map }: { statusKey: string; label: string; map: Record<string, { bg: string; text: string }> }) {
  const c = map[statusKey];
  if (!c) return <Badge>{label}</Badge>;
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[var(--text-xs)] font-medium"
      style={{ backgroundColor: c.bg, color: c.text }}
    >
      <span className="w-1.5 h-1.5 rounded-full opacity-50" style={{ background: c.text }} />
      {label}
    </span>
  );
}

function AreaBadge({ name }: { name: string }) {
  const t = useLocaleStore(s => s.t);
  const label = t(`common.bodyArea.${name}`);
  const c = BODY_AREA_BADGE[name];
  if (!c) return <Badge>{label}</Badge>;
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-[var(--app-radius-sm)] text-[var(--text-xs)] font-medium"
      style={{ backgroundColor: c.bg, color: c.text }}
    >
      {label}
    </span>
  );
}

function InfoBlock({ label, value, emphasis }: { label: string; value: React.ReactNode; emphasis?: boolean }) {
  return (
    <div>
      <div className="text-[var(--text-sm)] text-[var(--text-subdued)] mb-1">{label}</div>
      <div
        className={
          emphasis
            ? 'text-[var(--text-lg)] font-bold text-[var(--text-default)] tabular-nums'
            : 'text-[var(--text-base)] font-medium text-[var(--text-default)]'
        }
      >
        {value}
      </div>
    </div>
  );
}

export default function ConcernDetailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { id } = useParams<{ id: string }>();
  const t = useLocaleStore(s => s.t);
  const locale = useLocaleStore(s => s.locale);
  const SOURCE_LABELS: Record<string, string> = {
    organic: t('po.concernSourceOrganic'),
    referral: t('po.concernSourceReferral'),
    article: t('po.concernSourceArticle'),
    ad: t('po.concernSourceAd'),
    direct: t('po.concernSourceDirect'),
  };
  const [concern, setConcern] = useState<ConcernDetailWire | null>(null);
  const [myProposal, setMyProposal] = useState<ProposalDetailWire | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFoundError, setNotFoundError] = useState(false);
  const [proposeOpen, setProposeOpen] = useState(false);
  const [myProposalOpen, setMyProposalOpen] = useState(false);

  // deep link `?propose=1` (옛 propose 페이지 redirect) 자동 sheet 오픈 + URL 정리
  useEffect(() => {
    if (searchParams.get('propose') === '1') {
      setProposeOpen(true);
      router.replace(`/concerns/${id}`);
    }
  }, [searchParams, id, router]);

  const refresh = useCallback(() => {
    if (!id) return Promise.resolve();
    return Promise.all([getConcern(id), findMyProposalByConcern(id).catch(() => null)])
      .then(([data, proposal]) => {
        setConcern(data);
        setMyProposal(proposal);
      });
  }, [id]);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    refresh()
      .catch(err => {
        if (err instanceof ApiError && err.status === 404) {
          setNotFoundError(true);
        }
      })
      .finally(() => setLoading(false));
  }, [id, refresh]);

  if (loading) {
    return (
      <AdminPage
        sidebar={<POSidebar active="/concerns" />}
        title={t('po.concernDetailTitle')}
        prefix="po"
        onBack={() => router.back()}
      >
        <div className="flex items-center justify-center py-20">
          <Spinner />
        </div>
      </AdminPage>
    );
  }

  if (notFoundError || !concern) {
    notFound();
  }

  const statusLabel = t(`lifecycle.status.${CONCERN_STATUS_I18N_SUFFIX[concern.status] ?? concern.status}`) || concern.status;

  return (
    <>
      <AdminPage
        sidebar={<POSidebar active="/concerns" />}
        title={t('po.concernDetailTitle')}
        prefix="po"
        onBack={() => router.back()}
        actions={
          myProposal ? (
            <Button variant="secondary" size="sm" onClick={() => setMyProposalOpen(true)}>
              {t('po.concernViewMyProposal')}
            </Button>
          ) : (
            <Button variant="primary" size="sm" onClick={() => setProposeOpen(true)}>
              {t('po.concernCreateProposal')}
            </Button>
          )
        }
      >
        <div className="flex flex-col gap-4 max-w-[920px] mx-auto">

          {/* 1. Hero — 등록자 / 부위 / 상태 */}
          <Card padding="md">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="text-[var(--text-xl)] font-bold text-[var(--text-default)] leading-tight">
                  {concern.userName}
                </div>
                <div className="flex items-center flex-wrap gap-1.5 mt-2">
                  {concern.bodyAreas.map(area => (
                    <AreaBadge key={area} name={area} />
                  ))}
                  {concern.bodyAreaDetail && (
                    <span className="text-[var(--text-sm)] text-[var(--text-subdued)] ml-1">
                      · {concern.bodyAreaDetail}
                    </span>
                  )}
                </div>
                <div className="text-[var(--text-sm)] text-[var(--text-subdued)] mt-2 tabular-nums">
                  {t('po.concernInfoCreatedAt')} {formatDateKR(concern.createdAt, locale)}
                </div>
              </div>
              <div className="flex-shrink-0">
                <StatusBadge statusKey={concern.status} label={statusLabel} map={CONCERN_STATUS_BADGE} />
              </div>
            </div>
          </Card>

          {/* 2. 고민 내용 */}
          <Card padding="md">
            <SectionHeader title={t('po.concernSectionContent')} />
            <p className="text-[var(--text-base)] text-[var(--text-default)] leading-relaxed mt-3 whitespace-pre-wrap">
              {concern.description}
            </p>
          </Card>

          {/* 3. 핵심 정보 grid */}
          <Card padding="md">
            <SectionHeader title={t('po.concernSectionInfo')} />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-4 mt-3">
              <InfoBlock label={t('po.concernInfoBudget')} value={formatBudget(concern.budgetMin, concern.budgetMax)} emphasis />
              <InfoBlock label={t('po.concernInfoVisitDate')} value={concern.visitDateFrom ? formatDateRange(concern.visitDateFrom, concern.visitDateTo) : t('common.tbd')} />
              <InfoBlock label={t('po.concernInfoSource')} value={SOURCE_LABELS[concern.source] || concern.source} />
              <InfoBlock label={t('po.concernInfoProposalCount')} value={`${concern.proposalCount}${t('po.concernCountUnit')}`} />
            </div>
          </Card>

          {/* 4. 첨부 사진 */}
          {concern.photos.length > 0 && (
            <Card padding="md">
              <SectionHeader title={`${t('po.concernPhotoAlt')} (${t('po.proposalMetaCreditUnit', { count: concern.photos.length })})`} />
              <div className="grid grid-cols-3 gap-2 mt-3">
                {concern.photos.map(p => (
                  <div
                    key={p.id}
                    className="aspect-square rounded-[var(--app-radius)] bg-[var(--surface-subdued)] border border-[var(--border-subdued)] flex items-center justify-center text-[var(--text-disabled)] text-[var(--text-sm)] overflow-hidden"
                  >
                    {p.url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.url} alt={t('po.concernPhotoAlt')} className="w-full h-full object-cover" />
                    ) : (
                      t('po.concernPhotoPlaceholder')
                    )}
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* 5. 내 제안서 */}
          <Card padding="md">
            <SectionHeader title={t('po.concernSectionMyProposal')} />
            {myProposal ? (
              <div className="flex items-center justify-between gap-4 mt-3">
                <div className="flex-1 min-w-0">
                  <div className="text-[var(--text-md)] font-semibold text-[var(--text-default)] tabular-nums">
                    {formatKRW(myProposal.totalPrice)} · {t('common.recovery')} {t('po.proposalMetaDays', { days: myProposal.recoveryDays })}
                  </div>
                  <div className="text-[var(--text-sm)] text-[var(--text-subdued)] mt-1 truncate">
                    {myProposal.items.map(item => item.treatmentName).join(', ') || t('po.concernNoItems')}
                  </div>
                </div>
                <Button variant="secondary" size="sm" onClick={() => setMyProposalOpen(true)}>
                  {t('po.concernViewMyProposal')}
                </Button>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-[var(--text-base)] text-[var(--text-subdued)] mb-4">
                  {t('po.concernProposalNotSentYet')}
                </p>
                <Button variant="primary" size="sm" onClick={() => setProposeOpen(true)}>
                  {t('po.concernCreateProposal')}
                </Button>
              </div>
            )}
          </Card>

        </div>
      </AdminPage>

      {/* SideSheet — 제안서 작성 */}
      <ProposeFormSheet
        concernId={concern.id}
        open={proposeOpen}
        onClose={() => setProposeOpen(false)}
        onSuccess={() => { void refresh(); }}
      />

      {/* SideSheet — 내 제안서 보기 */}
      <MyProposalSheet
        concernId={concern.id}
        open={myProposalOpen}
        onClose={() => setMyProposalOpen(false)}
      />
    </>
  );
}

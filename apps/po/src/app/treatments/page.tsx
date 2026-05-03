'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { POSidebar } from '@/components/POSidebar';
import { Card, Button, SectionHeader, AdminPage, Modal, Spinner, DropdownMenu, type DropdownMenuItem } from '@hyliren/ui';
import { proceduresApi } from '@/lib/api/procedures';
import { toUserMessage } from '@/lib/api/error-messages';
import { useProcedures } from '@/hooks/queries/procedures';
import {
  useArchiveProcedure,
  useUnarchiveProcedure,
  usePermanentDeleteProcedure,
} from '@/hooks/mutations/procedures';
import { usePOAuthStore } from '@/store/po-auth';
import { useToastStore } from '@/store/toast';
import { useLocaleStore } from '@/store/locale';
import { pickI18n } from '@hyliren/shared/src/domain/procedure';
import { StatusChip } from '@/components/procedure-wizard/StatusChip';
import type { Procedure } from '@hyliren/shared';
import { Plus, ImageIcon, AlertTriangle, Trash2 } from 'lucide-react';

/*
  시술 상태 멘탈 모델 (2026-04-26)
  ── 진열/비진열 모델 ──
  - 공개 (published): 진열중 — 고객에게 노출
  - 비공개 (archived): 진열 내림 — 데이터 유지, 고객에게 미노출
  - 임시저장 (draft): 작성 중 — 계정당 1개, 목록 미노출

  이전 "삭제/보관함/복원" 용어는 폐기. 이유:
  - "삭제" 는 영구 제거 함의지만 실제론 status 토글일 뿐 (거짓말)
  - "복원" 은 삭제 후 되살림 함의지만 실제론 다시 공개 (거짓말)
  사장님 멘탈모델 = 진열대에 올렸다/내렸다. 이 모델로 라벨 통일.
*/
type StatusFilter = 'all' | 'published' | 'archived';

const STATUS_TAB_KEYS: { key: StatusFilter; labelKey: string }[] = [
  { key: 'all', labelKey: 'po.treatmentsFilterAll' },
  { key: 'published', labelKey: 'po.treatmentsFilterPublished' },
  { key: 'archived', labelKey: 'po.treatmentsFilterArchived' },
];

export default function TreatmentsPage() {
  const router = useRouter();
  const showToast = useToastStore(s => s.showToast);
  const t = useLocaleStore(s => s.t);
  const locale = useLocaleStore(s => s.locale);
  const member = usePOAuthStore(s => s.member);
  const [filter, setFilter] = useState<StatusFilter>('all');

  // React Query — status 별 분리 캐시. 탭 전환 시 keepPreviousData 로 부드럽게.
  const { data, isLoading: loading, isError, error, refetch } = useProcedures(
    filter === 'all' ? undefined : filter,
  );
  const loadError = isError ? (toUserMessage(error, t('po.treatmentsLoadError'), t)) : null;
  // 목록에서 가리는 항목 (BE 가 향후 hard-delete 분리하면 제거 가능):
  // (a) draft — 작성 중. '+ 새 시술 등록' 모달로만 접근.
  // (b) 한 번도 공개된 적 없는 archived (publishedAt=null) — '새로 작성하기' 시 폐기된 draft.
  const procedures: Procedure[] | null = data
    ? data.procedures.filter(p => {
        if (p.status === 'draft') return false;
        if (p.status === 'archived' && !p.publishedAt) return false;
        return true;
      })
    : null;

  // 새 시술 등록 분기 모달 — draft 가 있으면 '이어서/새로' 선택, '새로' 는 confirm 단계 추가
  const [draftModalOpen, setDraftModalOpen] = useState(false);
  const [draftModalStep, setDraftModalStep] = useState<'choose' | 'confirm'>('choose');
  const [existingDraft, setExistingDraft] = useState<Procedure | null>(null);
  const [creatingNew, setCreatingNew] = useState(false);

  // 비공개/공개/삭제 모달 — RQ mutation hook 으로 invalidate 자동.
  const [archiveTarget, setArchiveTarget] = useState<Procedure | null>(null);
  const [unarchiveTarget, setUnarchiveTarget] = useState<Procedure | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Procedure | null>(null);

  const archiveMutation = useArchiveProcedure();
  const unarchiveMutation = useUnarchiveProcedure();
  const deleteMutation = usePermanentDeleteProcedure();
  const archiving = archiveMutation.isPending;
  const unarchiving = unarchiveMutation.isPending;
  const deleting = deleteMutation.isPending;

  /* 에러 토스트 — RQ v5 onError 폐기 대응. */
  useEffect(() => {
    if (isError && error) {
      showToast(toUserMessage(error, t('po.treatmentsLoadError'), t), 'error');
    }
  }, [isError, error, showToast]);

  // "+ 새 시술 등록" 클릭 — draft 있으면 분기 모달, 없으면 바로 new
  async function handleNewClick() {
    if (creatingNew) return;
    setCreatingNew(true);
    try {
      const res = await proceduresApi.list({ status: 'draft' });
      const draft = res.procedures[0] ?? null;
      if (draft) {
        setExistingDraft(draft);
        setDraftModalStep('choose');
        setDraftModalOpen(true);
      } else {
        router.push('/treatments/new');
      }
    } catch {
      // draft 조회 실패해도 new 페이지로 진입은 보장
      router.push('/treatments/new');
    } finally {
      setCreatingNew(false);
    }
  }

  function handleResumeDraft() {
    if (!existingDraft) return;
    setDraftModalOpen(false);
    router.push(`/treatments/${existingDraft.id}/edit`);
  }

  async function handleConfirmNewWrite() {
    if (!existingDraft) return;
    try {
      await proceduresApi.softDelete(existingDraft.id);
      setDraftModalOpen(false);
      router.push('/treatments/new');
    } catch (e: unknown) {
      const msg = toUserMessage(e, t('po.treatmentDraftDeleteFail'), t);
      showToast(msg, 'error');
    }
  }

  const draftTitle = existingDraft
    ? pickI18n(existingDraft.i18n, locale, existingDraft.sourceLocale)?.content.title || t('po.treatmentNoTitle')
    : '';

  function handleConfirmArchive() {
    if (!archiveTarget) return;
    archiveMutation.mutate(archiveTarget.id, {
      onSuccess: () => {
        setArchiveTarget(null);
        showToast(t('po.treatmentArchivedSuccess'), 'success');
      },
      onError: (e) => {
        showToast(toUserMessage(e, t('po.treatmentSwitchFail'), t), 'error');
      },
    });
  }

  const archiveTargetTitle = archiveTarget
    ? pickI18n(archiveTarget.i18n, locale, archiveTarget.sourceLocale)?.content.title || t('po.treatmentNoTitle')
    : '';

  function handleConfirmUnarchive() {
    if (!unarchiveTarget) return;
    unarchiveMutation.mutate(unarchiveTarget.id, {
      onSuccess: () => {
        setUnarchiveTarget(null);
        showToast(t('po.treatmentPublishedSuccess'), 'success');
      },
      onError: (e) => {
        // BE publish-strict 검증 실패 시 — 사용자가 편집 후 재시도해야 함.
        showToast(toUserMessage(e, t('po.treatmentSwitchFail'), t), 'error');
      },
    });
  }

  const unarchiveTargetTitle = unarchiveTarget
    ? pickI18n(unarchiveTarget.i18n, locale, unarchiveTarget.sourceLocale)?.content.title || t('po.treatmentNoTitle')
    : '';

  function handleConfirmDelete() {
    if (!deleteTarget) return;
    deleteMutation.mutate(deleteTarget.id, {
      onSuccess: () => {
        setDeleteTarget(null);
        showToast(t('po.treatmentDeletedSuccess'), 'success');
      },
      onError: (e) => {
        showToast(toUserMessage(e, t('po.treatmentDeleteFail'), t), 'error');
      },
    });
  }

  const deleteTargetTitle = deleteTarget
    ? pickI18n(deleteTarget.i18n, locale, deleteTarget.sourceLocale)?.content.title || t('po.treatmentNoTitle')
    : '';

  return (
    <>
    <AdminPage
      sidebar={<POSidebar active="/treatments" />}
      title={t('po.treatmentsTitle')}
      actions={
        <Button variant="primary" size="sm" onClick={handleNewClick} disabled={creatingNew}>
          <Plus size={13} /> {t('po.treatmentNewRegisterCta')}
        </Button>
      }
      prefix="po"
    >
      {/* D2: 로딩·에러 중엔 카운트 숨김 — 빈 값(0)이 깜빡이며 "시술이 사라진 것 같은" 오인 방지 */}
      <SectionHeader
        title={
          loading || loadError || !procedures
            ? t('po.treatmentsRegistered')
            : t('po.treatmentsRegisteredCount', { count: procedures.length })
        }
      />

      {/* 상태 필터 탭 */}
      <div className="flex gap-1 mt-3 mb-4 border-b border-[var(--border-default)]">
        {STATUS_TAB_KEYS.map(tab => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setFilter(tab.key)}
            className={`
              px-3 py-2 text-[var(--text-xs)] font-medium border-b-2 -mb-px transition-colors
              ${filter === tab.key
                ? 'border-[var(--interactive-default)] text-[var(--text-default)]'
                : 'border-transparent text-[var(--text-disabled)] hover:text-[var(--text-default)]'}
            `}
          >
            {t(tab.labelKey)}
          </button>
        ))}
      </div>

      {loading && (
        <Card padding="md" className="mt-4">
          <div className="flex items-center justify-center py-12"><Spinner /></div>
        </Card>
      )}

      {/* D3: 에러 카드 — 재시도 버튼으로 복구 경로 제공 */}
      {!loading && loadError && (
        <Card padding="md" className="mt-4">
          <div className="text-center py-10">
            <AlertTriangle size={28} className="mx-auto mb-2 text-[var(--color-danger)]" />
            <p className="text-[var(--text-sm)] font-medium text-[var(--text-default)] mb-1">
              {t('po.treatmentsLoadError')}
            </p>
            <p className="text-[var(--text-xs)] text-[var(--text-disabled)] mb-4">{loadError}</p>
            <Button variant="secondary" size="sm" onClick={() => void refetch()}>
              {t('common.retry')}
            </Button>
          </div>
        </Card>
      )}

      {!loading && !loadError && procedures?.length === 0 && (
        <Card padding="md" className="mt-4">
          <div className="text-center py-12">
            {filter === 'all' ? (
              <>
                <p className="text-[var(--text-base)] font-medium text-[var(--text-default)] mb-1">
                  {t('po.treatmentsEmptyTitle')}
                </p>
                <p className="text-[var(--text-sm)] text-[var(--text-subdued)] mb-4">
                  {t('po.treatmentsEmptyDesc')}
                </p>
                <Button variant="primary" size="sm" onClick={handleNewClick} disabled={creatingNew}>
                  <Plus size={13} /> {t('po.treatmentsEmptyCta')}
                </Button>
              </>
            ) : (
              <p className="text-[var(--text-sm)] text-[var(--text-disabled)]">
                {t('po.treatmentsEmptyFiltered', { label: t(STATUS_TAB_KEYS.find(tab => tab.key === filter)?.labelKey ?? 'po.treatmentsFilterAll') })}
              </p>
            )}
          </div>
        </Card>
      )}

      {!loading && !loadError && procedures && procedures.length > 0 && (
        <div className="grid gap-3 mt-1" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
          {procedures.map(p => {
            const pick = pickI18n(p.i18n, 'ko', p.sourceLocale);
            const title = pick?.content.title || t('po.treatmentNoTitle');
            // 카드 = [Link 영역 (이미지+컨텐츠)] + [Footer 영역 (액션)] 구조.
            // Footer 가 Link 외부에 있어야 dropdown 클릭이 nav 으로 가로채지지 않음.
            return (
              <Card key={p.id} padding="none" className="flex flex-col">
                <Link
                  href={`/treatments/${p.id}/edit`}
                  className="no-underline block group cursor-pointer"
                >
                  <div className="h-32 bg-[var(--surface-subdued)] flex items-center justify-center overflow-hidden rounded-t-[var(--app-radius)] transition-opacity group-hover:opacity-95">
                    {p.heroImageUrl
                      ? <img src={p.heroImageUrl} alt="" className="w-full h-full object-cover" />
                      : <ImageIcon size={28} className="text-[var(--text-disabled)]" />}
                  </div>
                  <div className="px-3 pt-3 pb-2">
                    <p className="text-[var(--text-sm)] font-semibold text-[var(--text-default)] mb-1.5 line-clamp-1">
                      {title}
                    </p>
                    <div className="flex items-center gap-2 text-[var(--text-xs)] text-[var(--text-subdued)]">
                      <span>{t(`common.bodyArea.${p.primaryArea}`)}</span>
                      <span>·</span>
                      <span className="font-semibold text-[var(--text-default)]">
                        {p.priceMin === p.priceMax
                          ? `${(p.priceMin / 10000).toFixed(0)}${t('common.man')}`
                          : `${(p.priceMin / 10000).toFixed(0)}~${(p.priceMax / 10000).toFixed(0)}${t('common.man')}`}
                      </span>
                    </div>
                  </div>
                </Link>

                {/* footer — Link 외부. 자체 onClick 은 nav 우려 없이 자유롭게 동작. */}
                <div className="flex items-center justify-between gap-2 px-3 pt-2 pb-3 border-t border-[var(--border-subdued)]">
                  <StatusChip status={p.status} />
                  <div className="flex items-center gap-1">
                    {p.status === 'archived' ? (
                      <button
                        type="button"
                        onClick={() => setUnarchiveTarget(p)}
                        className="px-2.5 h-7 rounded-[var(--app-radius-sm)] text-[var(--text-xs)] font-medium text-[var(--text-default)] hover:bg-[var(--surface-subdued)] transition-colors cursor-pointer"
                      >
                        {t('po.treatmentUnarchive')}
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setArchiveTarget(p)}
                        className="px-2.5 h-7 rounded-[var(--app-radius-sm)] text-[var(--text-xs)] font-medium text-[var(--text-default)] hover:bg-[var(--surface-subdued)] transition-colors cursor-pointer"
                      >
                        {t('po.treatmentArchive')}
                      </button>
                    )}
                    {p.status === 'archived' && (
                      <DropdownMenu
                        items={[
                          {
                            label: t('po.treatmentDelete'),
                            icon: <Trash2 size={14} />,
                            destructive: true,
                            onClick: () => setDeleteTarget(p),
                          },
                        ]}
                      />
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </AdminPage>

    {/* 새 시술 등록 분기 모달 */}
    <Modal
      open={draftModalOpen}
      onClose={() => setDraftModalOpen(false)}
      title={draftModalStep === 'choose' ? t('po.draftExistsTitle') : t('po.draftDeleteConfirmTitle')}
    >
      {draftModalStep === 'choose' && existingDraft && (
        <div className="flex flex-col gap-5">
          <p className="text-[var(--text-base)] text-[var(--text-subdued)] leading-relaxed">
            <span className="font-semibold text-[var(--text-default)]">{draftTitle}</span> {t('po.draftExistsBody')}
          </p>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="primary" onClick={handleResumeDraft}>
              {t('po.draftResume')}
            </Button>
            <Button variant="secondary" onClick={() => setDraftModalStep('confirm')}>
              {t('po.draftStartNew')}
            </Button>
          </div>
        </div>
      )}

      {draftModalStep === 'confirm' && (
        <div className="flex flex-col gap-5">
          <p className="text-[var(--text-base)] text-[var(--text-subdued)] leading-relaxed">
            <span className="font-semibold text-[var(--text-default)]">{draftTitle}</span> {t('po.draftDeleteConfirmBody')}
          </p>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="secondary" onClick={() => setDraftModalStep('choose')}>
              {t('common.back')}
            </Button>
            <Button variant="primary" onClick={handleConfirmNewWrite}>
              {t('po.draftDeleteAndStartNew')}
            </Button>
          </div>
        </div>
      )}
    </Modal>

    {/* 비공개 전환 모달 — published → archived. 데이터 유지, 고객 노출만 차단. 토글이지 파괴 아님 (variant=primary). */}
    <Modal
      open={archiveTarget !== null}
      onClose={() => !archiving && setArchiveTarget(null)}
      title={t('po.treatmentArchiveTitle')}
    >
      {archiveTarget && (
        <div className="flex flex-col gap-5">
          <p className="text-[var(--text-base)] text-[var(--text-subdued)] leading-relaxed">
            <span className="font-semibold text-[var(--text-default)]">{archiveTargetTitle}</span>
            <br />
            {t('po.treatmentArchiveBody1')}
            <br />
            {t('po.treatmentArchiveBody2')}
          </p>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="secondary" onClick={() => setArchiveTarget(null)} disabled={archiving}>
              {t('common.cancel')}
            </Button>
            <Button variant="primary" onClick={handleConfirmArchive} disabled={archiving}>
              {archiving ? t('po.treatmentSwitching') : t('po.treatmentArchive')}
            </Button>
          </div>
        </div>
      )}
    </Modal>

    {/* 공개 전환 모달 — archived → published. BE 가 publish-strict 검증 자동 수행. */}
    <Modal
      open={unarchiveTarget !== null}
      onClose={() => !unarchiving && setUnarchiveTarget(null)}
      title={t('po.treatmentUnarchiveTitle')}
    >
      {unarchiveTarget && (
        <div className="flex flex-col gap-5">
          <p className="text-[var(--text-base)] text-[var(--text-subdued)] leading-relaxed">
            <span className="font-semibold text-[var(--text-default)]">{unarchiveTargetTitle}</span>
            <br />
            {t('po.treatmentUnarchiveBody')}
          </p>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="secondary" onClick={() => setUnarchiveTarget(null)} disabled={unarchiving}>
              {t('common.cancel')}
            </Button>
            <Button variant="primary" onClick={handleConfirmUnarchive} disabled={unarchiving}>
              {unarchiving ? t('po.treatmentSwitching') : t('po.treatmentUnarchive')}
            </Button>
          </div>
        </div>
      )}
    </Modal>

    {/* 삭제 모달 — archived 한정. deletedAt 세팅, 일반 사용자 복구 경로 없음 (admin 만).
        '영구 삭제' 워딩은 강해서 '삭제'로 부드럽게 — 단, body 에 '복구할 수 없습니다' 로 위험은 명시. */}
    <Modal
      open={deleteTarget !== null}
      onClose={() => !deleting && setDeleteTarget(null)}
      title={t('po.treatmentDeleteTitle')}
    >
      {deleteTarget && (
        <div className="flex flex-col gap-5">
          <p className="text-[var(--text-base)] text-[var(--text-subdued)] leading-relaxed">
            <span className="font-semibold text-[var(--text-default)]">{deleteTargetTitle}</span>
            <br />
            {t('po.treatmentDeleteModalDescPrefix')}<span className="font-semibold text-[var(--color-danger)]">{t('po.treatmentDeleteCannotRecover')}</span>
            <br />
            {t('po.treatmentDeleteHideRecommend')}
          </p>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="secondary" onClick={() => setDeleteTarget(null)} disabled={deleting}>
              {t('common.cancel')}
            </Button>
            <Button variant="danger" onClick={handleConfirmDelete} disabled={deleting}>
              {deleting ? t('po.treatmentDeleting') : t('po.treatmentDeleteAction')}
            </Button>
          </div>
        </div>
      )}
    </Modal>
    </>
  );
}

'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { POSidebar } from '@/components/POSidebar';
import { Card, Button, SectionHeader, AdminPage, Modal, Spinner, DropdownMenu, type DropdownMenuItem } from '@hyliren/ui';
import { proceduresApi } from '@/lib/api/procedures';
import { usePOAuthStore } from '@/store/po-auth';
import { useToastStore } from '@/store/toast';
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

const STATUS_TABS: { key: StatusFilter; label: string }[] = [
  { key: 'all', label: '전체' },
  { key: 'published', label: '공개' },
  { key: 'archived', label: '비공개' },
];

export default function TreatmentsPage() {
  const router = useRouter();
  const showToast = useToastStore(s => s.showToast);
  const member = usePOAuthStore(s => s.member);
  const [filter, setFilter] = useState<StatusFilter>('all');
  const [procedures, setProcedures] = useState<Procedure[] | null>(null);
  const [loading, setLoading] = useState(true);
  // D3: 로드 실패 시 procedures=[] 로 덮어버리면 "0건" 이 보여져 공개 상품이
  //     사라진 것처럼 오인됨. 에러 상태를 분리해 재시도 경로를 명시적으로 제공.
  const [loadError, setLoadError] = useState<string | null>(null);

  // 새 시술 등록 분기 모달 — draft 가 있으면 '이어서/새로' 선택, '새로' 는 confirm 단계 추가
  const [draftModalOpen, setDraftModalOpen] = useState(false);
  const [draftModalStep, setDraftModalStep] = useState<'choose' | 'confirm'>('choose');
  const [existingDraft, setExistingDraft] = useState<Procedure | null>(null);
  const [creatingNew, setCreatingNew] = useState(false);

  // 비공개 전환 모달 — 공개 카드의 EyeOff 클릭 시 진입.
  // published → archived. 데이터 유지, 고객 노출만 차단 (BE softDelete 활용).
  const [archiveTarget, setArchiveTarget] = useState<Procedure | null>(null);
  const [archiving, setArchiving] = useState(false);


  // 공개 전환 모달 — 비공개 카드의 '다시 공개' 클릭 시 진입.
  // archived → published. BE 가 publish-strict 검증 자동 수행.
  const [unarchiveTarget, setUnarchiveTarget] = useState<Procedure | null>(null);
  const [unarchiving, setUnarchiving] = useState(false);

  // 영구 삭제 모달 — archived 한정. ⋮ menu 의 destructive 항목.
  const [deleteTarget, setDeleteTarget] = useState<Procedure | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    if (!member) return;
    setLoading(true);
    setLoadError(null);
    try {
      const res = await proceduresApi.list({
        status: filter === 'all' ? undefined : filter,
      });
      // 목록에서 가리는 항목:
      // (a) draft — 작성 중. '+ 새 시술 등록' 모달로만 접근.
      // (b) 한 번도 공개된 적 없는 archived (publishedAt=null) — '새로 작성하기' 시 폐기된 draft.
      //     사용자는 '폐기' 했다고 인식하므로 비공개 탭에 띄우면 혼란.
      //     (BE 가 향후 draft 폐기를 hard-delete 로 분리하면 이 필터 제거 가능)
      setProcedures(res.procedures.filter(p => {
        if (p.status === 'draft') return false;
        if (p.status === 'archived' && !p.publishedAt) return false;
        return true;
      }));
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : '목록을 불러올 수 없습니다';
      setLoadError(msg);
    } finally {
      setLoading(false);
    }
  }, [member, filter]);

  useEffect(() => { void load(); }, [load]);

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
      const msg = e instanceof Error ? e.message : '임시저장 삭제에 실패했습니다';
      showToast(msg, 'error');
    }
  }

  const draftTitle = existingDraft
    ? pickI18n(existingDraft.i18n, 'ko', existingDraft.sourceLocale)?.content.title || '(제목 없음)'
    : '';

  async function handleConfirmArchive() {
    if (!archiveTarget) return;
    setArchiving(true);
    try {
      await proceduresApi.softDelete(archiveTarget.id);
      setArchiveTarget(null);
      showToast('비공개로 전환되었습니다.', 'success');
      void load();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : '전환에 실패했습니다';
      showToast(msg, 'error');
    } finally {
      setArchiving(false);
    }
  }

  const archiveTargetTitle = archiveTarget
    ? pickI18n(archiveTarget.i18n, 'ko', archiveTarget.sourceLocale)?.content.title || '(제목 없음)'
    : '';

  async function handleConfirmUnarchive() {
    if (!unarchiveTarget) return;
    setUnarchiving(true);
    try {
      await proceduresApi.update(unarchiveTarget.id, { status: 'published' });
      setUnarchiveTarget(null);
      showToast('공개로 전환되었습니다.', 'success');
      void load();
    } catch (e: unknown) {
      // BE publish-strict 검증 실패 시 — 사용자가 편집 후 재시도해야 함.
      const msg = e instanceof Error ? e.message : '전환에 실패했습니다';
      showToast(msg, 'error');
    } finally {
      setUnarchiving(false);
    }
  }

  const unarchiveTargetTitle = unarchiveTarget
    ? pickI18n(unarchiveTarget.i18n, 'ko', unarchiveTarget.sourceLocale)?.content.title || '(제목 없음)'
    : '';

  async function handleConfirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await proceduresApi.permanentDelete(deleteTarget.id);
      setDeleteTarget(null);
      showToast('영구 삭제되었습니다.', 'success');
      void load();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : '삭제에 실패했습니다';
      showToast(msg, 'error');
    } finally {
      setDeleting(false);
    }
  }

  const deleteTargetTitle = deleteTarget
    ? pickI18n(deleteTarget.i18n, 'ko', deleteTarget.sourceLocale)?.content.title || '(제목 없음)'
    : '';

  return (
    <>
    <AdminPage
      sidebar={<POSidebar active="/treatments" />}
      title="시술 관리"
      actions={
        <Button variant="primary" size="sm" onClick={handleNewClick} disabled={creatingNew}>
          <Plus size={13} /> 새 시술 등록
        </Button>
      }
      prefix="po"
    >
      {/* D2: 로딩·에러 중엔 카운트 숨김 — 빈 값(0)이 깜빡이며 "시술이 사라진 것 같은" 오인 방지 */}
      <SectionHeader
        title={
          loading || loadError || !procedures
            ? '등록한 시술'
            : `등록한 시술 (${procedures.length})`
        }
      />

      {/* 상태 필터 탭 */}
      <div className="flex gap-1 mt-3 mb-4 border-b border-[var(--border-default)]">
        {STATUS_TABS.map(tab => (
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
            {tab.label}
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
              목록을 불러오지 못했어요
            </p>
            <p className="text-[var(--text-xs)] text-[var(--text-disabled)] mb-4">{loadError}</p>
            <Button variant="secondary" size="sm" onClick={() => void load()}>
              다시 시도
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
                  아직 등록된 시술이 없어요
                </p>
                <p className="text-[var(--text-sm)] text-[var(--text-subdued)] mb-4">
                  고객이 상담 신청할 수 있는 시술을 등록해 보세요.
                </p>
                <Button variant="primary" size="sm" onClick={handleNewClick} disabled={creatingNew}>
                  <Plus size={13} /> 첫 시술 등록하기
                </Button>
              </>
            ) : (
              <p className="text-[var(--text-sm)] text-[var(--text-disabled)]">
                {STATUS_TABS.find(t => t.key === filter)?.label} 상태의 시술이 없습니다.
              </p>
            )}
          </div>
        </Card>
      )}

      {!loading && !loadError && procedures && procedures.length > 0 && (
        <div className="grid gap-3 mt-1" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
          {procedures.map(p => {
            const pick = pickI18n(p.i18n, 'ko', p.sourceLocale);
            const title = pick?.content.title || '(제목 없음)';
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
                      <span>{p.primaryArea}</span>
                      <span>·</span>
                      <span className="font-semibold text-[var(--text-default)]">
                        {p.priceMin === p.priceMax
                          ? `${(p.priceMin / 10000).toFixed(0)}만`
                          : `${(p.priceMin / 10000).toFixed(0)}~${(p.priceMax / 10000).toFixed(0)}만`}
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
                        다시 공개
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setArchiveTarget(p)}
                        className="px-2.5 h-7 rounded-[var(--app-radius-sm)] text-[var(--text-xs)] font-medium text-[var(--text-default)] hover:bg-[var(--surface-subdued)] transition-colors cursor-pointer"
                      >
                        비공개로 전환
                      </button>
                    )}
                    {p.status === 'archived' && (
                      <DropdownMenu
                        items={[
                          {
                            label: '영구 삭제',
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
      title={draftModalStep === 'choose' ? '임시저장이 있습니다' : '이전 작성건을 삭제할까요?'}
    >
      {draftModalStep === 'choose' && existingDraft && (
        <div className="flex flex-col gap-5">
          <p className="text-[var(--text-base)] text-[var(--text-subdued)] leading-relaxed">
            <span className="font-semibold text-[var(--text-default)]">{draftTitle}</span> 으로 작성하던 시술이 있어요.
          </p>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="primary" onClick={handleResumeDraft}>
              이어서 작성하기
            </Button>
            <Button variant="secondary" onClick={() => setDraftModalStep('confirm')}>
              새로 작성하기
            </Button>
          </div>
        </div>
      )}

      {draftModalStep === 'confirm' && (
        <div className="flex flex-col gap-5">
          <p className="text-[var(--text-base)] text-[var(--text-subdued)] leading-relaxed">
            <span className="font-semibold text-[var(--text-default)]">{draftTitle}</span> 임시저장은 복구할 수 없습니다.
          </p>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="secondary" onClick={() => setDraftModalStep('choose')}>
              뒤로
            </Button>
            <Button variant="primary" onClick={handleConfirmNewWrite}>
              삭제하고 새로 작성
            </Button>
          </div>
        </div>
      )}
    </Modal>

    {/* 비공개 전환 모달 — published → archived. 데이터 유지, 고객 노출만 차단. 토글이지 파괴 아님 (variant=primary). */}
    <Modal
      open={archiveTarget !== null}
      onClose={() => !archiving && setArchiveTarget(null)}
      title="이 시술을 비공개로 전환할까요?"
    >
      {archiveTarget && (
        <div className="flex flex-col gap-5">
          <p className="text-[var(--text-base)] text-[var(--text-subdued)] leading-relaxed">
            <span className="font-semibold text-[var(--text-default)]">{archiveTargetTitle}</span>
            <br />
            비공개 상태에서는 고객에게 노출되지 않습니다.
            <br />
            언제든 다시 공개할 수 있어요.
          </p>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="secondary" onClick={() => setArchiveTarget(null)} disabled={archiving}>
              취소
            </Button>
            <Button variant="primary" onClick={handleConfirmArchive} disabled={archiving}>
              {archiving ? '전환 중...' : '비공개로'}
            </Button>
          </div>
        </div>
      )}
    </Modal>

    {/* 공개 전환 모달 — archived → published. BE 가 publish-strict 검증 자동 수행. */}
    <Modal
      open={unarchiveTarget !== null}
      onClose={() => !unarchiving && setUnarchiveTarget(null)}
      title="이 시술을 다시 공개할까요?"
    >
      {unarchiveTarget && (
        <div className="flex flex-col gap-5">
          <p className="text-[var(--text-base)] text-[var(--text-subdued)] leading-relaxed">
            <span className="font-semibold text-[var(--text-default)]">{unarchiveTargetTitle}</span>
            <br />
            공개 상태로 전환하면 고객에게 다시 노출됩니다.
          </p>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="secondary" onClick={() => setUnarchiveTarget(null)} disabled={unarchiving}>
              취소
            </Button>
            <Button variant="primary" onClick={handleConfirmUnarchive} disabled={unarchiving}>
              {unarchiving ? '전환 중...' : '공개로'}
            </Button>
          </div>
        </div>
      )}
    </Modal>

    {/* 영구 삭제 모달 — archived 한정. deletedAt 세팅, 일반 사용자 복구 경로 없음 (admin 만). */}
    <Modal
      open={deleteTarget !== null}
      onClose={() => !deleting && setDeleteTarget(null)}
      title="시술을 영구 삭제할까요?"
    >
      {deleteTarget && (
        <div className="flex flex-col gap-5">
          <p className="text-[var(--text-base)] text-[var(--text-subdued)] leading-relaxed">
            <span className="font-semibold text-[var(--text-default)]">{deleteTargetTitle}</span>
            <br />
            영구 삭제 후에는 <span className="font-semibold text-[var(--color-danger)]">복구할 수 없습니다.</span>
            <br />
            비공개 상태로만 두시려면 취소를 눌러 주세요.
          </p>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="secondary" onClick={() => setDeleteTarget(null)} disabled={deleting}>
              취소
            </Button>
            <Button variant="danger" onClick={handleConfirmDelete} disabled={deleting}>
              {deleting ? '삭제 중...' : '영구 삭제'}
            </Button>
          </div>
        </div>
      )}
    </Modal>
    </>
  );
}

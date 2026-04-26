'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { POSidebar } from '@/components/POSidebar';
import { Card, Button, Badge, SectionHeader, AdminPage, Modal, Spinner } from '@hyliren/ui';
import { proceduresApi } from '@/lib/api/procedures';
import { usePOAuthStore } from '@/store/po-auth';
import { useToastStore } from '@/store/toast';
import { pickI18n } from '@hyliren/shared/src/domain/procedure';
import type { Procedure, ProcedureStatus } from '@hyliren/shared';
import { Plus, ImageIcon, Pencil, AlertTriangle, FileEdit, FilePlus2 } from 'lucide-react';

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

  const load = useCallback(async () => {
    if (!member) return;
    setLoading(true);
    setLoadError(null);
    try {
      const res = await proceduresApi.list({
        status: filter === 'all' ? undefined : filter,
      });
      setProcedures(res.procedures);
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

  return (
    <>
    <AdminPage
      sidebar={<POSidebar active="/treatments" />}
      title="시술 관리"
      actions={
        <Button variant="accent" size="sm" onClick={handleNewClick} disabled={creatingNew}>
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

      {/* D3: 에러 카드 — 재시도 버튼으로 복구 경로 제공 */}
      {!loading && loadError && (
        <Card padding="md" className="mt-4">
          <div className="text-center py-10">
            <AlertTriangle size={28} className="mx-auto mb-2 text-[var(--color-danger)]" />
            <p className="text-[13px] font-medium text-[var(--color-text)] mb-1">
              목록을 불러오지 못했어요
            </p>
            <p className="text-[12px] text-[var(--color-text-dim)] mb-4">{loadError}</p>
            <Button variant="secondary" size="sm" onClick={() => void load()}>
              다시 시도
            </Button>
          </div>
        </Card>
      )}

      {!loading && !loadError && procedures?.length === 0 && (
        <Card padding="md" className="mt-4">
          <div className="text-center py-12">
            <p className="text-[13px] text-[var(--color-text-dim)] mb-3">
              {filter === 'all'
                ? '등록된 시술이 없습니다.'
                : `${STATUS_TABS.find(t => t.key === filter)?.label} 상태의 시술이 없습니다.`}
            </p>
            <Button variant="accent" size="sm" onClick={handleNewClick} disabled={creatingNew}>
              <Plus size={13} /> 첫 시술 등록하기
            </Button>
          </div>
        </Card>
      )}

      {!loading && !loadError && procedures && procedures.length > 0 && (
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
                      {/* D2: draft/archived 는 public 노출 전이라 조회·북마크 의미 없음 */}
                      <span>
                        {p.status === 'published'
                          ? `조회 ${p.viewCount} · 북마크 ${p.bookmarkCount}`
                          : '수정하기'}
                      </span>
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

    {/* 새 시술 등록 분기 모달 — draft 가 있을 때 */}
    <Modal
      open={draftModalOpen}
      onClose={() => setDraftModalOpen(false)}
      title={draftModalStep === 'choose' ? '작성 중인 임시저장이 있습니다' : '새로 작성하시겠어요?'}
    >
      {draftModalStep === 'choose' && existingDraft && (
        <div className="flex flex-col gap-4">
          <p className="text-[var(--text-base)] text-[var(--text-default)] leading-relaxed">
            <strong className="font-semibold">{draftTitle}</strong> 으로 임시저장된 작성건이 있습니다.
            이어서 작성하거나 새로 시작할 수 있습니다.
          </p>
          <div className="flex flex-col gap-2">
            <Button variant="accent" onClick={handleResumeDraft}>
              <FileEdit size={14} /> 이어서 작성하기
            </Button>
            <Button variant="secondary" onClick={() => setDraftModalStep('confirm')}>
              <FilePlus2 size={14} /> 새로 작성하기
            </Button>
          </div>
        </div>
      )}

      {draftModalStep === 'confirm' && (
        <div className="flex flex-col gap-4">
          <div className="flex items-start gap-3 p-3 rounded-[var(--app-radius)] bg-[var(--color-danger-soft)]">
            <AlertTriangle size={18} className="text-[var(--color-danger)] flex-shrink-0 mt-0.5" />
            <p className="text-[var(--text-base)] text-[var(--text-default)] leading-relaxed">
              <strong className="font-semibold">{draftTitle}</strong> 임시저장이
              <strong className="text-[var(--color-danger)]"> 영구 삭제</strong>됩니다.
              새로 작성을 시작하면 이전 작성건은 복구할 수 없습니다.
            </p>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setDraftModalStep('choose')}>
              뒤로
            </Button>
            <Button variant="accent" onClick={handleConfirmNewWrite}>
              삭제하고 새로 작성
            </Button>
          </div>
        </div>
      )}
    </Modal>
    </>
  );
}

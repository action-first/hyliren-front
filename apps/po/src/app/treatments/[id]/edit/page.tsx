'use client';

import { useMemo, useRef, useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Modal, Spinner, DropdownMenu, type DropdownMenuItem } from '@hyliren/ui';
import { Eye, EyeOff, Trash2 } from 'lucide-react';
import { POSidebar } from '@/components/POSidebar';
import { WizardShell } from '@/components/procedure-wizard/WizardShell';
import { StatusChip } from '@/components/procedure-wizard/StatusChip';
import { Step1Basics } from '@/components/procedure-wizard/Step1Basics';
import { Step2Pricing } from '@/components/procedure-wizard/Step2Pricing';
import { Step3Content } from '@/components/procedure-wizard/Step3Content';
import { Step4Preview } from '@/components/procedure-wizard/Step4Preview';
import { usePOAuthStore } from '@/store/po-auth';
import { useToastStore } from '@/store/toast';
import { proceduresApi } from '@/lib/api/procedures';
import {
  stepIsValid, allStepsValid, stepsValidForDraft, sanitizeWizardForm,
} from '@/lib/wizard/validation';
import { track } from '@hyliren/shared/src/events';
import { pickI18n } from '@hyliren/shared/src/domain/procedure';
import type { WizardForm, WizardVariant } from '@/lib/wizard/types';
import type { ProcedureStatus, Procedure, ProcedureVariant } from '@hyliren/shared';

const STEPS = [
  { key: 'basics', label: '기본 정보' },
  { key: 'pricing', label: '가격·옵션' },
  { key: 'content', label: '상세·이미지' },
  { key: 'preview', label: '미리보기·공개' },
];

/** API 에서 로드한 procedure + variants 를 wizard 폼 형태로 변환. */
function toWizardForm(p: Procedure, variants: ProcedureVariant[]): WizardForm {
  return {
    primaryArea: p.primaryArea,
    procedureType: p.procedureType,
    heroImageUrl: p.heroImageUrl,
    slug: p.slug,
    sourceLocale: p.sourceLocale,
    i18n: p.i18n,
    basePrice: p.basePrice,
    baseAnesthesia: p.baseAnesthesia,
    baseDurationMinutes: p.baseDurationMinutes,
    baseRecoveryDays: p.baseRecoveryDays,
    baseHospitalStayDays: p.baseHospitalStayDays,
    variants: variants.map<WizardVariant>(v => ({
      id: v.id, isNew: false,
      price: v.price, anesthesia: v.anesthesia,
      durationMinutes: v.durationMinutes,
      recoveryDays: v.recoveryDays,
      hospitalStayDays: v.hospitalStayDays,
      sortOrder: v.sortOrder,
      isDefault: v.isDefault,
      i18n: v.i18n,
    })),
    galleryImageUrls: p.galleryImageUrls,
    status: p.status,
  };
}

export default function EditProcedurePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const member = usePOAuthStore(s => s.member);
  const { showToast } = useToastStore();

  const [form, setForm] = useState<WizardForm | null>(null);
  const [activeStep, setActiveStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  // 비공개 전환 모달 — published → archived. 데이터 유지, 고객 노출만 차단.
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [archiving, setArchiving] = useState(false);
  // 공개 전환 모달 — archived → published. BE 가 publish-strict 검증 자동 수행.
  const [unarchiveOpen, setUnarchiveOpen] = useState(false);
  const [unarchiving, setUnarchiving] = useState(false);
  // 영구 삭제 모달 — archived 한정. deletedAt 세팅, 복구 불가 안내.
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  // 등록 옵션 모달 (draft 한정) — '완료하기' 클릭 시 공개/비공개 선택.
  const [publishOptionOpen, setPublishOptionOpen] = useState(false);
  // H3: setState race 로 인한 중복 제출 방지
  const savingRef = useRef(false);

  // Auto-save 상태 — body header indicator 로 노출
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const autoSaveRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedBodyRef = useRef<string | null>(null);

  useEffect(() => {
    if (!member) return;
    let cancelled = false;
    proceduresApi.get(id)
      .then(({ procedure, variants }) => {
        if (cancelled) return;
        setForm(toWizardForm(procedure, variants));
        // Instrumentation: edit wizard 진입 (create 와 동일 funnel 에 묶어 등록 완료율 계산)
        track({
          eventType: 'treatment_wizard_start',
          actorType: 'member',
          actorId: member.id,
          targetId: id,
          metadata: { source: 'po', locale: 'ko', mode: 'edit' },
        });
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        setLoadError(e instanceof Error ? e.message : '불러올 수 없습니다');
      });
    return () => { cancelled = true; };
  }, [id, member]);

  const stepsWithDone = useMemo(
    () => STEPS.map((s, i) => ({ ...s, done: form ? stepIsValid(form, i) : false })),
    [form],
  );

  /**
   * Auto-save (draft only, body+i18n 한정).
   * - form 변경 감지 → 2s 디바운스 → PATCH.
   * - variant 변경은 auto-save 대상 아님 (diff 비용·정확성 이슈) — 임시저장 버튼 눌러야 반영.
   * - published 상태는 explicit 공개 클릭으로만 저장 (실수 방지).
   */
  useEffect(() => {
    if (!form || !member || saving) return;

    const bodySnap = JSON.stringify({
      primaryArea: form.primaryArea,
      procedureType: form.procedureType,
      heroImageUrl: form.heroImageUrl,
      galleryImageUrls: form.galleryImageUrls,
      slug: form.slug,
      basePrice: form.basePrice,
      baseAnesthesia: form.baseAnesthesia,
      baseDurationMinutes: form.baseDurationMinutes,
      baseRecoveryDays: form.baseRecoveryDays,
      baseHospitalStayDays: form.baseHospitalStayDays,
      i18n: form.i18n,
    });

    // 최초 load 는 baseline 설정만
    if (lastSavedBodyRef.current === null) {
      lastSavedBodyRef.current = bodySnap;
      return;
    }
    if (lastSavedBodyRef.current === bodySnap) return;

    // draft 만 자동 저장. published 는 "공개" 버튼으로 명시적.
    if (form.status !== 'draft') return;
    if (!stepsValidForDraft(form)) return;
    // 타입 narrowing — stepsValidForDraft 가 보장하지만 TS 는 모름
    if (!form.primaryArea || !form.procedureType) return;
    const primaryArea = form.primaryArea;
    const procedureType = form.procedureType;

    if (autoSaveRef.current) clearTimeout(autoSaveRef.current);
    autoSaveRef.current = setTimeout(async () => {
      const clean = sanitizeWizardForm(form);
      setSaveStatus('saving');
      try {
        await proceduresApi.update(id, {
          primaryArea,
          procedureType,
          heroImageUrl: clean.heroImageUrl || undefined,
          galleryImageUrls: clean.galleryImageUrls.filter(u => u.trim()),
          slug: clean.slug || undefined,
          basePrice: clean.basePrice,
          baseAnesthesia: clean.baseAnesthesia,
          baseDurationMinutes: clean.baseDurationMinutes,
          baseRecoveryDays: clean.baseRecoveryDays,
          baseHospitalStayDays: clean.baseHospitalStayDays,
          i18n: clean.i18n,
          status: 'draft',
        });
        lastSavedBodyRef.current = bodySnap;
        setSaveStatus('saved');
        setSavedAt(Date.now());
      } catch {
        setSaveStatus('error');
      }
    }, 2000);

    return () => { if (autoSaveRef.current) clearTimeout(autoSaveRef.current); };
  }, [form, member, id, saving]);

  function patch(p: Partial<WizardForm>) {
    setForm(prev => prev ? { ...prev, ...p } : prev);
  }

  /** 본체 + i18n 을 PATCH. variants 는 별도 diff 처리. */
  async function submit(status: ProcedureStatus) {
    // H3: 중복 클릭 방지
    if (savingRef.current) return;
    if (!member || !form || !form.primaryArea || !form.procedureType) return;
    // D1: draft 저장은 Step 1 최소 필드만, published 는 전체 검증
    const ok = status === 'published' ? allStepsValid(form) : stepsValidForDraft(form);
    if (!ok) {
      showToast(
        status === 'published'
          ? '필수 입력값을 모두 채워주세요.'
          : '분류와 원본 언어 타이틀은 최소한 입력해야 저장할 수 있어요.',
        'error',
      );
      return;
    }

    // C1: title 없는 비소스 locale 블록 제거
    const clean = sanitizeWizardForm(form);

    savingRef.current = true;
    setSaving(true);
    try {
      // 1. 본체 PATCH
      await proceduresApi.update(id, {
        primaryArea: clean.primaryArea as typeof form.primaryArea & string,
        procedureType: clean.procedureType as typeof form.procedureType & string,
        heroImageUrl: clean.heroImageUrl || undefined,
        galleryImageUrls: clean.galleryImageUrls.filter(u => u.trim()),
        slug: clean.slug || undefined,
        basePrice: clean.basePrice,
        baseAnesthesia: clean.baseAnesthesia,
        baseDurationMinutes: clean.baseDurationMinutes,
        baseRecoveryDays: clean.baseRecoveryDays,
        baseHospitalStayDays: clean.baseHospitalStayDays,
        i18n: clean.i18n,
        status,
      });

      // 2. variant diff — 현재 서버 상태 가져와서 비교
      const fresh = await proceduresApi.get(id);
      const serverIds = new Set(fresh.variants.map(v => v.id));
      const localIds = new Set(clean.variants.filter(v => !v.isNew).map(v => v.id));

      // C3: 순서를 [신규 POST → 기존 PATCH → 쓸모없는 DELETE] 로. 삭제 후순위.
      //     "마지막 variant 를 새 것으로 swap" 시 서버 마지막-1개 가드 충돌 방지.

      // 2a. 신규 variant 먼저 생성
      for (const v of clean.variants) {
        if (!v.isNew) continue;
        await proceduresApi.addVariant(id, {
          price: v.price, anesthesia: v.anesthesia,
          durationMinutes: v.durationMinutes,
          recoveryDays: v.recoveryDays,
          hospitalStayDays: v.hospitalStayDays,
          sortOrder: v.sortOrder,
          isDefault: v.isDefault,
          i18n: v.i18n,
        });
      }

      // 2b. 기존 variant PATCH
      for (const v of clean.variants) {
        if (v.isNew) continue;
        await proceduresApi.updateVariant(id, v.id, {
          price: v.price, anesthesia: v.anesthesia,
          durationMinutes: v.durationMinutes,
          recoveryDays: v.recoveryDays,
          hospitalStayDays: v.hospitalStayDays,
          sortOrder: v.sortOrder,
          isDefault: v.isDefault,
          i18n: v.i18n,
        });
      }

      // 2c. 로컬에 없어진 기존 variant 삭제 (마지막에)
      for (const sid of serverIds) {
        if (!localIds.has(sid)) {
          await proceduresApi.removeVariant(id, sid);
        }
      }

      track({
        eventType: 'treatment_wizard_save_success',
        actorType: 'member',
        actorId: member.id,
        targetId: id,
        metadata: { source: 'po', locale: 'ko', mode: 'edit', value: status },
      });
      showToast(
        status === 'published'
          ? '공개되었습니다.'
          : status === 'draft'
            ? '임시저장되었습니다.'
            : '저장되었습니다.',
        'success',
      );
      // 명시적 save 후 목록 복귀 — "task done" 시그널 강화. 사용자가 변경 반영을 즉시 확인.
      // (auto-save 는 별도 경로로 silent 동작 — 이 redirect 와 무관.)
      router.push('/treatments');
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : '저장 실패';
      track({
        eventType: 'treatment_wizard_save_fail',
        actorType: 'member',
        actorId: member.id,
        targetId: id,
        metadata: { source: 'po', locale: 'ko', mode: 'edit', value: status, label: msg.slice(0, 120) },
      });
      showToast(msg, 'error');
      // C4: 실패 시 서버 상태로 싱크 — 부분 저장 상태를 드러내고 다음 시도 안전 보장
      try {
        const reload = await proceduresApi.get(id);
        setForm(toWizardForm(reload.procedure, reload.variants));
        showToast('서버 상태로 복구되었습니다. 다시 시도해주세요.', 'info');
      } catch { /* reload 실패는 무시 — 기존 에러가 더 중요 */ }
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  }

  async function handleConfirmArchive() {
    if (!member) return;
    setArchiving(true);
    try {
      await proceduresApi.softDelete(id);
      showToast('비공개로 전환되었습니다.', 'success');
      router.push('/treatments');
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : '전환에 실패했습니다', 'error');
      setArchiving(false);
      setArchiveOpen(false);
    }
  }

  async function handleConfirmUnarchive() {
    if (!member) return;
    setUnarchiving(true);
    try {
      await proceduresApi.update(id, { status: 'published' });
      showToast('공개로 전환되었습니다.', 'success');
      // 폼 status 만 변경 — 다른 필드 변경 없음 — 즉시 reload 해서 최신 상태 반영.
      const reload = await proceduresApi.get(id);
      setForm(toWizardForm(reload.procedure, reload.variants));
      setUnarchiveOpen(false);
    } catch (e: unknown) {
      // BE publish-strict 검증 실패 시 — 사용자가 누락 항목 보완 후 재시도해야 함.
      showToast(e instanceof Error ? e.message : '전환에 실패했습니다', 'error');
    } finally {
      setUnarchiving(false);
    }
  }

  async function handleConfirmPermanentDelete() {
    if (!member) return;
    setDeleting(true);
    try {
      await proceduresApi.permanentDelete(id);
      showToast('영구 삭제되었습니다.', 'success');
      router.push('/treatments');
    } catch (e: unknown) {
      // BE 가드 (archived 상태 아님) 위반 등 에러를 사용자에게 그대로 노출.
      showToast(e instanceof Error ? e.message : '삭제에 실패했습니다', 'error');
      setDeleting(false);
      setDeleteOpen(false);
    }
  }

  if (loadError) {
    return (
      <div className="flex h-screen">
        <POSidebar active="/treatments" />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-[var(--text-base)] text-[var(--color-danger)]">{loadError}</p>
        </div>
      </div>
    );
  }
  if (!form) {
    return (
      <div className="flex h-screen">
        <POSidebar active="/treatments" />
        <div className="flex-1 flex items-center justify-center">
          <Spinner />
        </div>
      </div>
    );
  }

  const procedureTitle = pickI18n(form.i18n, 'ko', form.sourceLocale)?.content.title || '(제목 없음)';

  /**
   * 수정 화면 액션 정책 (확정):
   *
   * | status     | primary           | secondary  | menu               |
   * |------------|-------------------|------------|--------------------|
   * | draft      | 공개하기 (strict) | 임시저장   | (비움)             |
   * | published  | 변경사항 저장     | (없음)     | 비공개로 전환      |
   * | archived   | 변경사항 저장     | 다시 공개  | 영구 삭제          |
   *
   * 원칙:
   * - draft 는 어느 step 이든 'commit = 공개하기' 단일 의도. 미완성이면 disabled,
   *   secondary '임시저장' 으로 백업.
   * - published/archived 는 '변경사항 저장' 으로 status 유지.
   * - 저장/임시저장 동시 visible 은 draft 외엔 회피 (사용자 불안 감소).
   */
  const primaryActionConfig = (() => {
    if (form.status === 'draft') {
      return {
        // 클릭 시 모달로 공개/비공개 선택. 마법사 마지막 = 진열 결정의 의식.
        // (mode='create' 라 Step 1-3 에선 WizardShell 이 '다음' 으로 자동 대체)
        label: '완료하기',
        onClick: () => setPublishOptionOpen(true),
        disabled: saving || !allStepsValid(form),
        loading: saving,
      };
    }
    if (form.status === 'published') {
      return {
        label: '변경사항 저장',
        onClick: () => submit('published'),
        disabled: saving || !allStepsValid(form),
        loading: saving,
      };
    }
    // archived
    return {
      label: '변경사항 저장',
      onClick: () => submit('archived'),
      disabled: saving || !stepsValidForDraft(form),
      loading: saving,
    };
  })();

  /**
   * 하단 bar 의 secondary visible button — status 별 분기.
   * - draft: 임시저장 (loose, 미완성 백업)
   * - archived: 다시 공개 (visible 로 두어 destructive 인 영구삭제와 시각 분리)
   * - published: 없음
   */
  const secondaryButton = (() => {
    if (form.status === 'draft') {
      return (
        <Button
          variant="secondary" size="sm"
          onClick={() => submit('draft')}
          disabled={saving || !stepsValidForDraft(form)}
        >
          임시저장
        </Button>
      );
    }
    if (form.status === 'archived') {
      return (
        <Button
          variant="secondary" size="sm"
          onClick={() => setUnarchiveOpen(true)}
          disabled={saving}
        >
          다시 공개
        </Button>
      );
    }
    return null;
  })();

  /**
   * ⋮ menu — destructive 또는 가끔 쓰는 status transition.
   * - published: 비공개로 전환
   * - archived: 영구 삭제 (visible secondary 와 분리해 위험도 차등)
   * - draft: 비움 (폐기는 list 의 '+ 새 시술 등록 → 새로 작성' 흐름)
   */
  const menuItems: DropdownMenuItem[] = (() => {
    if (form.status === 'archived') {
      return [
        { label: '영구 삭제', icon: <Trash2 size={14} />, destructive: true, onClick: () => setDeleteOpen(true) },
      ];
    }
    if (form.status === 'published') {
      return [
        { label: '비공개로 전환', icon: <EyeOff size={14} />, onClick: () => setArchiveOpen(true) },
      ];
    }
    return [];
  })();

  return (
    <div className="flex h-screen">
      <POSidebar active="/treatments" />
      <div className="flex-1 flex flex-col bg-white">
        <WizardShell
          title="시술 수정"
          /* mode 분기:
             - draft: sequential (1-3 = '다음' per-step / 4 = '공개하기'). 작성 완료 흐름.
             - published/archived: free 탐색. '변경사항 저장' 어디서나. 부분 수정 흐름.
             사용자 멘탈모델: draft 는 끝까지 채우는 '진행', non-draft 는 부분 수정 '편집'. */
          mode={form.status === 'draft' ? 'create' : 'edit'}
          steps={stepsWithDone}
          activeIndex={activeStep}
          onStepChange={i => {
            // draft 는 sequential — 미완 step 건너뛰기 차단 (단, 뒤로 이동은 자유)
            if (form.status === 'draft') {
              if (i <= activeStep || stepsWithDone[i - 1]?.done) setActiveStep(i);
            } else {
              setActiveStep(i);
            }
          }}
          onPrev={() => setActiveStep(Math.max(0, activeStep - 1))}
          onNext={() => setActiveStep(Math.min(STEPS.length - 1, activeStep + 1))}
          nextDisabled={!stepIsValid(form, activeStep)}
          saveStatus={saveStatus}
          savedAt={savedAt}
          headerInfo={<StatusChip status={form.status} />}
          actions={secondaryButton}
          primaryAction={primaryActionConfig}
          menu={menuItems.length > 0 ? <DropdownMenu items={menuItems} /> : null}
        >
          {activeStep === 0 && <Step1Basics form={form} onChange={patch} />}
          {activeStep === 1 && <Step2Pricing form={form} onChange={patch} />}
          {activeStep === 2 && <Step3Content form={form} onChange={patch} />}
          {activeStep === 3 && <Step4Preview form={form} />}
        </WizardShell>
      </div>

      {/* 비공개 전환 모달 — published → archived. 데이터 유지, 고객 노출만 차단. */}
      <Modal
        open={archiveOpen}
        onClose={() => !archiving && setArchiveOpen(false)}
        title="이 시술을 비공개로 전환할까요?"
      >
        <div className="flex flex-col gap-5">
          <p className="text-[var(--text-base)] text-[var(--text-subdued)] leading-relaxed">
            <span className="font-semibold text-[var(--text-default)]">{procedureTitle}</span>
            <br />
            비공개 상태에서는 고객에게 노출되지 않습니다.
            <br />
            언제든 다시 공개할 수 있어요.
          </p>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="secondary" onClick={() => setArchiveOpen(false)} disabled={archiving}>
              취소
            </Button>
            <Button variant="primary" onClick={handleConfirmArchive} disabled={archiving}>
              {archiving ? '전환 중...' : '비공개로'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* 공개 전환 모달 — archived → published. BE 가 publish-strict 검증 자동 수행. */}
      <Modal
        open={unarchiveOpen}
        onClose={() => !unarchiving && setUnarchiveOpen(false)}
        title="이 시술을 다시 공개할까요?"
      >
        <div className="flex flex-col gap-5">
          <p className="text-[var(--text-base)] text-[var(--text-subdued)] leading-relaxed">
            <span className="font-semibold text-[var(--text-default)]">{procedureTitle}</span>
            <br />
            공개 상태로 전환하면 고객에게 다시 노출됩니다.
          </p>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="secondary" onClick={() => setUnarchiveOpen(false)} disabled={unarchiving}>
              취소
            </Button>
            <Button variant="primary" onClick={handleConfirmUnarchive} disabled={unarchiving}>
              {unarchiving ? '전환 중...' : '공개로'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* 영구 삭제 모달 — archived 한정. deletedAt 세팅, 일반 사용자에게 복구 경로 없음 (admin 만). */}
      <Modal
        open={deleteOpen}
        onClose={() => !deleting && setDeleteOpen(false)}
        title="시술을 영구 삭제할까요?"
      >
        <div className="flex flex-col gap-5">
          <p className="text-[var(--text-base)] text-[var(--text-subdued)] leading-relaxed">
            <span className="font-semibold text-[var(--text-default)]">{procedureTitle}</span>
            <br />
            영구 삭제 후에는 <span className="font-semibold text-[var(--color-danger)]">복구할 수 없습니다.</span>
            <br />
            보관함 (비공개) 으로만 두시려면 취소를 눌러주세요.
          </p>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="secondary" onClick={() => setDeleteOpen(false)} disabled={deleting}>
              취소
            </Button>
            <Button variant="danger" onClick={handleConfirmPermanentDelete} disabled={deleting}>
              {deleting ? '삭제 중...' : '영구 삭제'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* 등록 옵션 선택 모달 (draft 한정) — '완료하기' 클릭 시 진입. 공개/비공개 분기.
          데이터 완성 후 진열 결정의 명시적 의식 — 새 등록 페이지와 동일 패턴. */}
      <Modal
        open={publishOptionOpen}
        onClose={() => !saving && setPublishOptionOpen(false)}
        title="이 시술을 어떻게 저장할까요?"
      >
        <div className="flex flex-col gap-3">
          <button
            type="button"
            disabled={saving}
            onClick={() => {
              setPublishOptionOpen(false);
              void submit('published');
            }}
            className="text-left p-4 rounded-[var(--app-radius)] border border-[var(--color-success)] bg-[var(--color-success-soft)] hover:bg-[var(--color-success-soft)] hover:border-[var(--color-success)] transition-colors disabled:opacity-[var(--opacity-disabled)] disabled:cursor-not-allowed cursor-pointer"
          >
            <div className="flex items-center gap-2 mb-1">
              <Eye size={16} className="text-[var(--color-success)]" />
              <span className="text-[var(--text-sm)] font-semibold text-[var(--text-default)]">공개로 저장</span>
            </div>
            <p className="text-[var(--app-text-micro)] text-[var(--text-subdued)] leading-relaxed">
              즉시 고객에게 노출됩니다. 상담 신청 화면과 시술 상세에 표시돼요.
            </p>
          </button>

          <button
            type="button"
            disabled={saving}
            onClick={() => {
              setPublishOptionOpen(false);
              void submit('archived');
            }}
            className="text-left p-4 rounded-[var(--app-radius)] border border-[var(--border-default)] bg-[var(--surface-default)] hover:bg-[var(--surface-subdued)] transition-colors disabled:opacity-[var(--opacity-disabled)] disabled:cursor-not-allowed cursor-pointer"
          >
            <div className="flex items-center gap-2 mb-1">
              <EyeOff size={16} className="text-[var(--text-subdued)]" />
              <span className="text-[var(--text-sm)] font-semibold text-[var(--text-default)]">비공개로 저장</span>
            </div>
            <p className="text-[var(--app-text-micro)] text-[var(--text-subdued)] leading-relaxed">
              데이터만 저장하고 고객에게는 아직 노출하지 않습니다. 시술 관리에서 언제든 공개로 전환할 수 있어요.
            </p>
          </button>

          <Button variant="secondary" onClick={() => setPublishOptionOpen(false)} disabled={saving}>
            취소
          </Button>
        </div>
      </Modal>
    </div>
  );
}

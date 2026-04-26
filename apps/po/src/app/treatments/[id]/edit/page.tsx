'use client';

import { useMemo, useRef, useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Modal, Spinner } from '@hyliren/ui';
import { Trash2 } from 'lucide-react';
import { POSidebar } from '@/components/POSidebar';
import { WizardShell } from '@/components/procedure-wizard/WizardShell';
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
  // 삭제 확인 모달 — soft delete (status → archived). 목록의 '보관함' 탭에서 복구 가능.
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
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
    () => form ? STEPS.map((s, i) => ({ ...s, done: stepIsValid(form, i) })) : STEPS,
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
        status === 'published' ? '공개되었습니다.' : '저장되었습니다.',
        'success',
      );
      // 성공 후 서버 상태로 리로드
      const reload = await proceduresApi.get(id);
      setForm(toWizardForm(reload.procedure, reload.variants));
      // Auto-save baseline 동기화 — 이 시점 form = 방금 저장된 상태
      lastSavedBodyRef.current = null; // effect 가 다음 render 에서 재설정
      setSaveStatus('saved');
      setSavedAt(Date.now());
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

  async function handleConfirmDelete() {
    if (!member) return;
    setDeleting(true);
    try {
      await proceduresApi.softDelete(id);
      showToast('삭제되었습니다.', 'success');
      router.push('/treatments');
    } catch (e: unknown) {
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

  return (
    <div className="flex h-screen">
      <POSidebar active="/treatments" />
      <div className="flex-1 flex flex-col bg-white">
        <WizardShell
          title="시술 수정"
          steps={stepsWithDone}
          activeIndex={activeStep}
          onStepChange={setActiveStep}
          onPrev={() => setActiveStep(Math.max(0, activeStep - 1))}
          onNext={() => setActiveStep(Math.min(STEPS.length - 1, activeStep + 1))}
          nextDisabled={!stepIsValid(form, activeStep)}
          saveStatus={saveStatus}
          savedAt={savedAt}
          actions={
            <>
              {/* archived 는 이미 보관함 — 같은 액션 다시 노출하면 혼란. 향후 '복원' 별도 추가 가능. */}
              {form.status !== 'archived' && (
                <Button variant="secondary" size="sm" onClick={() => setDeleteOpen(true)} disabled={saving}>
                  <Trash2 size={13} /> 삭제
                </Button>
              )}
              {/* 마지막 step 에선 primaryAction (저장) 이 대체 — 임시저장 미노출 */}
              {activeStep < STEPS.length - 1 && (
                <Button
                  variant="secondary" size="sm"
                  onClick={() => submit('draft')}
                  disabled={saving || !stepsValidForDraft(form)}
                >
                  임시저장
                </Button>
              )}
            </>
          }
          primaryAction={{
            // 저장 = 현재 status 유지. 공개 전환은 Step4 배너의 별도 액션.
            label: '저장',
            onClick: () => submit(form.status),
            disabled: saving || !stepsValidForDraft(form),
            loading: saving,
          }}
        >
          {activeStep === 0 && <Step1Basics form={form} onChange={patch} />}
          {activeStep === 1 && <Step2Pricing form={form} onChange={patch} />}
          {activeStep === 2 && <Step3Content form={form} onChange={patch} />}
          {activeStep === 3 && (
            <Step4Preview
              form={form}
              onPublish={() => submit('published')}
              publishDisabled={!allStepsValid(form)}
              publishing={saving}
            />
          )}
        </WizardShell>
      </div>

      {/* 삭제 확인 모달 — soft delete (status → archived). 목록 '보관함' 탭에서 복구 가능. */}
      <Modal
        open={deleteOpen}
        onClose={() => !deleting && setDeleteOpen(false)}
        title="시술을 삭제할까요?"
      >
        <div className="flex flex-col gap-5">
          <p className="text-[var(--text-base)] text-[var(--text-subdued)] leading-relaxed">
            <span className="font-semibold text-[var(--text-default)]">{procedureTitle}</span> 을(를) 삭제합니다.
            <br />
            삭제된 시술은 <span className="font-semibold text-[var(--text-default)]">보관함</span> 탭에서 다시 확인할 수 있습니다.
          </p>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="secondary" onClick={() => setDeleteOpen(false)} disabled={deleting}>
              취소
            </Button>
            <Button variant="danger" onClick={handleConfirmDelete} disabled={deleting}>
              {deleting ? '삭제 중...' : '삭제'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

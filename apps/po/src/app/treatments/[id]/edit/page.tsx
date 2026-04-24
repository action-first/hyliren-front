'use client';

import { useMemo, useRef, useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Spinner } from '@hyliren/ui';
import { POSidebar } from '@/components/POSidebar';
import { WizardShell } from '@/components/procedure-wizard/WizardShell';
import { Step1Basics } from '@/components/procedure-wizard/Step1Basics';
import { Step2Pricing } from '@/components/procedure-wizard/Step2Pricing';
import { Step3Content } from '@/components/procedure-wizard/Step3Content';
import { Step4Preview } from '@/components/procedure-wizard/Step4Preview';
import { usePOAuthStore } from '@/store/po-auth';
import { useToastStore } from '@/store/toast';
import { proceduresApi } from '@/lib/api/procedures';
import { stepIsValid, allStepsValid, sanitizeWizardForm } from '@/lib/wizard/validation';
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
  // H3: setState race 로 인한 중복 제출 방지
  const savingRef = useRef(false);

  useEffect(() => {
    if (!member) return;
    let cancelled = false;
    proceduresApi.get(id, member.id)
      .then(({ procedure, variants }) => {
        if (cancelled) return;
        setForm(toWizardForm(procedure, variants));
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

  function patch(p: Partial<WizardForm>) {
    setForm(prev => prev ? { ...prev, ...p } : prev);
  }

  /** 본체 + i18n 을 PATCH. variants 는 별도 diff 처리. */
  async function submit(status: ProcedureStatus) {
    // H3: 중복 클릭 방지
    if (savingRef.current) return;
    if (!member || !form || !form.primaryArea || !form.procedureType) return;
    if (!allStepsValid(form)) {
      showToast('필수 입력값을 모두 채워주세요.', 'error');
      return;
    }

    // C1: title 없는 비소스 locale 블록 제거
    const clean = sanitizeWizardForm(form);

    savingRef.current = true;
    setSaving(true);
    try {
      // 1. 본체 PATCH
      await proceduresApi.update(id, member.id, {
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
      const fresh = await proceduresApi.get(id, member.id);
      const serverIds = new Set(fresh.variants.map(v => v.id));
      const localIds = new Set(clean.variants.filter(v => !v.isNew).map(v => v.id));

      // C3: 순서를 [신규 POST → 기존 PATCH → 쓸모없는 DELETE] 로. 삭제 후순위.
      //     "마지막 variant 를 새 것으로 swap" 시 서버 마지막-1개 가드 충돌 방지.

      // 2a. 신규 variant 먼저 생성
      for (const v of clean.variants) {
        if (!v.isNew) continue;
        await proceduresApi.addVariant(id, member.id, {
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
        await proceduresApi.updateVariant(id, v.id, member.id, {
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
          await proceduresApi.removeVariant(id, sid, member.id);
        }
      }

      showToast(
        status === 'published' ? '공개되었습니다.' : '저장되었습니다.',
        'success',
      );
      // 성공 후 서버 상태로 리로드
      const reload = await proceduresApi.get(id, member.id);
      setForm(toWizardForm(reload.procedure, reload.variants));
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : '저장 실패';
      showToast(msg, 'error');
      // C4: 실패 시 서버 상태로 싱크 — 부분 저장 상태를 드러내고 다음 시도 안전 보장
      try {
        const reload = await proceduresApi.get(id, member.id);
        setForm(toWizardForm(reload.procedure, reload.variants));
        showToast('서버 상태로 복구되었습니다. 다시 시도해주세요.', 'info');
      } catch { /* reload 실패는 무시 — 기존 에러가 더 중요 */ }
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  }

  async function archive() {
    if (!member) return;
    if (!confirm('이 시술을 보관함으로 이동합니다. 계속할까요?')) return;
    try {
      await proceduresApi.softDelete(id, member.id);
      showToast('보관함으로 이동되었습니다.', 'info');
      router.push('/treatments');
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : '실패', 'error');
    }
  }

  if (loadError) {
    return (
      <div className="flex h-screen">
        <POSidebar active="/treatments" />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-[14px] text-[var(--color-danger)]">{loadError}</p>
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
          actions={
            <>
              <Button variant="secondary" size="sm" onClick={archive} disabled={saving}>
                보관함
              </Button>
              <Button
                variant="secondary" size="sm"
                onClick={() => submit('draft')}
                disabled={saving || !allStepsValid(form)}
              >
                임시저장
              </Button>
            </>
          }
          primaryAction={{
            label: form.status === 'published' ? '수정 공개' : '공개',
            onClick: () => submit('published'),
            disabled: !allStepsValid(form),
            loading: saving,
          }}
        >
          {activeStep === 0 && <Step1Basics form={form} onChange={patch} />}
          {activeStep === 1 && <Step2Pricing form={form} onChange={patch} />}
          {activeStep === 2 && <Step3Content form={form} onChange={patch} />}
          {activeStep === 3 && <Step4Preview form={form} />}
        </WizardShell>
      </div>
    </div>
  );
}

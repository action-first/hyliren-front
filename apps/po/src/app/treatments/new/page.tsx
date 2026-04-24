'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@hyliren/ui';
import { POSidebar } from '@/components/POSidebar';
import { WizardShell } from '@/components/procedure-wizard/WizardShell';
import { Step1Basics } from '@/components/procedure-wizard/Step1Basics';
import { Step2Pricing } from '@/components/procedure-wizard/Step2Pricing';
import { Step3Content } from '@/components/procedure-wizard/Step3Content';
import { Step4Preview } from '@/components/procedure-wizard/Step4Preview';
import { usePOAuthStore } from '@/store/po-auth';
import { useToastStore } from '@/store/toast';
import { proceduresApi } from '@/lib/api/procedures';
import { emptyWizardForm } from '@/lib/wizard/defaults';
import { stepIsValid, allStepsValid } from '@/lib/wizard/validation';
import type { WizardForm } from '@/lib/wizard/types';
import type { ProcedureStatus } from '@hyliren/shared';

const STEPS = [
  { key: 'basics', label: '기본 정보' },
  { key: 'pricing', label: '가격·옵션' },
  { key: 'content', label: '상세·이미지' },
  { key: 'preview', label: '미리보기·공개' },
];

export default function NewProcedurePage() {
  const router = useRouter();
  const member = usePOAuthStore(s => s.member);
  const { showToast } = useToastStore();

  const [form, setForm] = useState<WizardForm>(() => emptyWizardForm());
  const [activeStep, setActiveStep] = useState(0);
  const [saving, setSaving] = useState(false);

  const stepsWithDone = useMemo(
    () => STEPS.map((s, i) => ({ ...s, done: stepIsValid(form, i) })),
    [form],
  );

  function patch(p: Partial<WizardForm>) {
    setForm(prev => ({ ...prev, ...p }));
  }

  async function submit(status: ProcedureStatus) {
    if (!member) {
      showToast('로그인이 필요합니다.', 'error');
      return;
    }
    if (!allStepsValid(form)) {
      showToast('필수 입력값을 모두 채워주세요.', 'error');
      return;
    }
    if (!form.primaryArea || !form.procedureType) return;

    setSaving(true);
    try {
      const res = await proceduresApi.create({
        memberId: member.id,
        primaryArea: form.primaryArea,
        procedureType: form.procedureType,
        heroImageUrl: form.heroImageUrl,
        galleryImageUrls: form.galleryImageUrls.filter(u => u.trim()),
        slug: form.slug || undefined,
        basePrice: form.basePrice,
        baseAnesthesia: form.baseAnesthesia,
        baseDurationMinutes: form.baseDurationMinutes,
        baseRecoveryDays: form.baseRecoveryDays,
        baseHospitalStayDays: form.baseHospitalStayDays,
        sourceLocale: form.sourceLocale,
        i18n: form.i18n,
        status,
        variants: form.variants.map(v => ({
          price: v.price,
          anesthesia: v.anesthesia,
          durationMinutes: v.durationMinutes,
          recoveryDays: v.recoveryDays,
          hospitalStayDays: v.hospitalStayDays,
          sortOrder: v.sortOrder,
          isDefault: v.isDefault,
          i18n: v.i18n,
        })),
      });
      showToast(
        status === 'published' ? '시술이 공개되었습니다.' : '임시저장되었습니다.',
        'success',
      );
      router.push(`/treatments/${res.procedure.id}/edit`);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : '저장 실패';
      showToast(msg, 'error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex h-screen">
      <POSidebar active="/treatments" />
      <div className="flex-1 flex flex-col bg-white">
        <WizardShell
          title="새 시술 등록"
          steps={stepsWithDone}
          activeIndex={activeStep}
          onStepChange={i => { if (i <= activeStep || stepsWithDone[i - 1]?.done) setActiveStep(i); }}
          onPrev={() => setActiveStep(Math.max(0, activeStep - 1))}
          onNext={() => setActiveStep(Math.min(STEPS.length - 1, activeStep + 1))}
          nextDisabled={!stepIsValid(form, activeStep)}
          actions={
            <Button
              variant="secondary"
              size="sm"
              onClick={() => submit('draft')}
              disabled={saving || !allStepsValid(form)}
            >
              임시저장
            </Button>
          }
          primaryAction={{
            label: '공개',
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

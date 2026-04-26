'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Modal } from '@hyliren/ui';
import { Eye, EyeOff } from 'lucide-react';
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
import {
  stepIsValid, allStepsValid, stepsValidForDraft, sanitizeWizardForm,
} from '@/lib/wizard/validation';
import { track } from '@hyliren/shared/src/events';
import type { WizardForm } from '@/lib/wizard/types';
import type { ProcedureStatus } from '@hyliren/shared';

const STEPS = [
  { key: 'basics', label: '기본 정보' },
  { key: 'pricing', label: '가격·옵션' },
  { key: 'content', label: '상세·이미지' },
  { key: 'preview', label: '미리보기·공개' },
];

/** 입력 데이터가 있는지 판단 — empty form 대비. */
function isFormDirty(form: WizardForm): boolean {
  return !!(
    form.primaryArea ||
    form.procedureType ||
    form.heroImageUrl?.trim() ||
    form.basePrice > 0 ||
    form.galleryImageUrls.length > 0 ||
    Object.values(form.i18n).some(b => b?.title?.trim() || b?.description?.trim() || b?.precautions?.trim()) ||
    form.variants.some(v => v.i18n[form.sourceLocale]?.name?.trim() || v.price)
  );
}

export default function NewProcedurePage() {
  const router = useRouter();
  const member = usePOAuthStore(s => s.member);
  const { showToast } = useToastStore();

  /* sessionStorage persist 제거 (2026-04-26):
     이전엔 작성본을 자동으로 sessionStorage 에 저장 → 재진입 시 복원했으나,
     "임시저장 안 누르고 떠난 데이터가 살아 있어 진입점이 꼬임" 사용자 보고.
     데이터는 명시적 임시저장 (BE 저장) 만 인정. 그 외 이탈 시엔 휘발. */
  const [form, setForm] = useState<WizardForm>(() => emptyWizardForm());
  const [activeStep, setActiveStep] = useState(0);
  const [saving, setSaving] = useState(false);
  // 등록 시 공개/비공개 선택 모달 — Step 4 primary '등록하기' 클릭 시 진입.
  const [publishOptionOpen, setPublishOptionOpen] = useState(false);
  // 이탈 경고 모달 — dirty 상태에서 in-app nav 시도 시 노출.
  const [discardModalOpen, setDiscardModalOpen] = useState(false);
  const pendingNavRef = useRef<string | null>(null);
  // H3: setState race 로 인한 중복 제출 방지
  const savingRef = useRef(false);

  /**
   * 이탈 가드:
   * - 브라우저 탭 닫기/뒤로 = beforeunload 네이티브 경고
   * - 사이드바 등 in-app <a> 클릭 = capture phase 인터셉트 → 경고 모달
   * 사용자가 명시적으로 임시저장/등록 안 한 데이터는 떠날 때 휘발.
   */
  useEffect(() => {
    if (!isFormDirty(form)) return; // 빈 폼이면 가드 불필요

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    const handleClick = (e: MouseEvent) => {
      if (e.defaultPrevented) return;
      // form 영역 자체의 클릭은 통과 (input, button 등) — link 한정
      const link = (e.target as HTMLElement | null)?.closest?.('a') as HTMLAnchorElement | null;
      if (!link) return;
      if (link.target === '_blank') return; // 새 탭은 그대로 두자
      const href = link.getAttribute('href');
      if (!href || href.startsWith('http') || href.startsWith('mailto:') || href.startsWith('#')) return;
      // 같은 페이지 자체 링크는 통과
      if (href === '/treatments/new') return;

      e.preventDefault();
      e.stopPropagation();
      pendingNavRef.current = href;
      setDiscardModalOpen(true);
    };
    document.addEventListener('click', handleClick, { capture: true });

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('click', handleClick, { capture: true });
    };
  }, [form]);

  function handleConfirmDiscard() {
    setDiscardModalOpen(false);
    const target = pendingNavRef.current;
    pendingNavRef.current = null;
    if (target) router.push(target);
  }

  function handleCancelDiscard() {
    setDiscardModalOpen(false);
    pendingNavRef.current = null;
  }

  // Instrumentation: wizard 진입 (등록 완료율 = save_success ÷ start)
  useEffect(() => {
    if (!member) return;
    track({
      eventType: 'treatment_wizard_start',
      actorType: 'member',
      actorId: member.id,
      metadata: { source: 'po', locale: 'ko', mode: 'create' },
    });
  }, [member]);

  const stepsWithDone = useMemo(
    () => STEPS.map((s, i) => ({ ...s, done: stepIsValid(form, i) })),
    [form],
  );

  function patch(p: Partial<WizardForm>) {
    setForm(prev => ({ ...prev, ...p }));
  }

  async function submit(status: ProcedureStatus) {
    // H3: 중복 클릭 방지
    if (savingRef.current) return;
    if (!member) {
      showToast('로그인이 필요합니다.', 'error');
      return;
    }
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
    if (!form.primaryArea || !form.procedureType) return;

    savingRef.current = true;
    setSaving(true);
    try {
      // C1: title 없는 비소스 locale 블록 제거 (Step3 빈 block seed 로 인한 400 방지)
      const clean = sanitizeWizardForm(form);
      const res = await proceduresApi.create({
        primaryArea: clean.primaryArea as typeof form.primaryArea & string,
        procedureType: clean.procedureType as typeof form.procedureType & string,
        heroImageUrl: clean.heroImageUrl,
        galleryImageUrls: clean.galleryImageUrls.filter(u => u.trim()),
        slug: clean.slug || undefined,
        basePrice: clean.basePrice,
        baseAnesthesia: clean.baseAnesthesia,
        baseDurationMinutes: clean.baseDurationMinutes,
        baseRecoveryDays: clean.baseRecoveryDays,
        baseHospitalStayDays: clean.baseHospitalStayDays,
        sourceLocale: clean.sourceLocale,
        i18n: clean.i18n,
        status,
        variants: clean.variants.map(v => ({
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
      track({
        eventType: 'treatment_wizard_save_success',
        actorType: 'member',
        actorId: member.id,
        targetId: res.procedure.id,
        metadata: { source: 'po', locale: 'ko', mode: 'create', value: status },
      });
      showToast(
        status === 'published'
          ? '공개로 등록되었습니다.'
          : status === 'archived'
            ? '비공개로 등록되었습니다.'
            : '임시저장되었습니다.',
        'success',
      );
      // 저장 완료 → 목록 복귀. 서버 저장 완료 시점이라 nav guard 도 불필요.
      // (form state 는 unmount 시 휘발 — 재진입 시 fresh form)
      router.push('/treatments');
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : '저장 실패';
      track({
        eventType: 'treatment_wizard_save_fail',
        actorType: 'member',
        actorId: member.id,
        metadata: { source: 'po', locale: 'ko', mode: 'create', value: status, label: msg.slice(0, 120) },
      });
      showToast(msg, 'error');
    } finally {
      savingRef.current = false;
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
            /* 임시저장은 모든 step 에서 사용 가능 — '저장 후 나중에 마저 작성' 흐름 보장.
               이전 코드는 step 4 에서 숨겼으나 step 4 primary 가 '공개하기' 로 바뀌면서
               draft 백업 경로가 사라지므로 step 4 에도 노출 필요. */
            <Button
              variant="secondary"
              size="sm"
              onClick={() => submit('draft')}
              disabled={saving || !stepsValidForDraft(form)}
            >
              임시저장
            </Button>
          }
          primaryAction={{
            /* Step 4 (마지막) primary = '등록하기' — 클릭 시 모달로 공개/비공개 선택.
               데이터 완성 = 진열 결정의 갈림길. 모달이 의식 (ceremony) 역할. */
            label: '등록하기',
            onClick: () => setPublishOptionOpen(true),
            disabled: saving || !allStepsValid(form),
            loading: saving,
          }}
        >
          {activeStep === 0 && <Step1Basics form={form} onChange={patch} />}
          {activeStep === 1 && <Step2Pricing form={form} onChange={patch} />}
          {activeStep === 2 && <Step3Content form={form} onChange={patch} />}
          {activeStep === 3 && <Step4Preview form={form} />}
        </WizardShell>
      </div>

      {/* 등록 옵션 선택 모달 — '등록하기' 클릭 시 진입. 공개/비공개 분기.
          데이터 완성 후 진열 결정의 명시적 의식 (ceremony) — 잘못된 선택 즉시 인지. */}
      <Modal
        open={publishOptionOpen}
        onClose={() => !saving && setPublishOptionOpen(false)}
        title="이 시술을 어떻게 등록할까요?"
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
              <span className="text-[var(--text-sm)] font-semibold text-[var(--text-default)]">공개로 등록</span>
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
              <span className="text-[var(--text-sm)] font-semibold text-[var(--text-default)]">비공개로 등록</span>
            </div>
            <p className="text-[var(--app-text-micro)] text-[var(--text-subdued)] leading-relaxed">
              데이터만 저장하고 고객에게는 아직 노출하지 않습니다. 시술 관리 메뉴에서 언제든 공개로 전환할 수 있어요.
            </p>
          </button>

          <Button variant="secondary" onClick={() => setPublishOptionOpen(false)} disabled={saving}>
            취소
          </Button>
        </div>
      </Modal>

      {/* 이탈 경고 모달 — 사이드바 등 in-app <a> 클릭 시 dirty 상태면 노출.
          확인 시 nav 진행 + form 휘발. 취소 시 같은 페이지 유지. */}
      <Modal
        open={discardModalOpen}
        onClose={handleCancelDiscard}
        title="작성 내용을 두고 나가시겠어요?"
      >
        <div className="flex flex-col gap-5">
          <p className="text-[var(--text-base)] text-[var(--text-subdued)] leading-relaxed">
            저장하지 않고 나가면 지금까지 입력한 내용이 <span className="font-semibold text-[var(--color-danger)]">사라집니다.</span>
            <br />
            계속 이어서 작성하려면 먼저 <span className="font-semibold text-[var(--text-default)]">임시저장</span> 을 눌러 주세요.
          </p>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="secondary" onClick={handleCancelDiscard}>
              계속 작성
            </Button>
            <Button variant="danger" onClick={handleConfirmDiscard}>
              저장 안 하고 나가기
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

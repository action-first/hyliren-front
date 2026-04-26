'use client';

import { Button } from '@hyliren/ui';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';
import { StepProgress, type StepDef } from './StepProgress';

interface WizardShellProps {
  /** 페이지 상위 제목 — body header 의 breadcrumb (예: '시술 등록' / '시술 수정') */
  title: string;
  /**
   * 모드 결정:
   * - 'create' (기본): sequential 마법사. 1-3 step 'primary=다음', 마지막 step 'primary=공개하기'.
   * - 'edit': 자유 탐색. 다음/이전 비노출, primaryAction 모든 단계 노출.
   */
  mode?: 'create' | 'edit';
  steps: StepDef[];
  activeIndex: number;
  onStepChange?: (index: number) => void;
  children: React.ReactNode;

  /**
   * 헤더 정보 영역 (제어 아님). 상태 chip 등 맥락 정보용 ReactNode.
   * SaveIndicator 좌측에 노출. 액션 버튼은 여기에 두지 말 것 — 하단 bar 가 담당.
   */
  headerInfo?: React.ReactNode;
  /**
   * 하단 sticky bar 의 secondary 버튼 (예: 임시저장, 다시 공개).
   * Primary 좌측에 노출. 자주 쓰고 안전한 액션 한정.
   */
  actions?: React.ReactNode;
  /**
   * 하단 sticky bar 의 핵심 CTA. create 의 1-3 step 에선 '다음', 마지막 step 에선 caller 가 지정.
   * edit 모드는 모든 step 에서 caller 가 지정한 primary 노출.
   */
  primaryAction: {
    label: string;
    onClick: () => void;
    disabled?: boolean;
    loading?: boolean;
  };
  /**
   * 하단 sticky bar 의 ⋮ 드롭다운 (가끔 쓰거나 destructive 액션). 비면 미렌더.
   */
  menu?: React.ReactNode;
  onPrev?: () => void;
  onNext?: () => void;
  nextDisabled?: boolean;

  /** 자동 저장 상태 인디케이터. */
  saveStatus?: 'idle' | 'saving' | 'saved' | 'error';
  /** 마지막 저장 시각 (상대 표기용, ms). */
  savedAt?: number | null;
}

function formatSavedAgo(savedAt: number | null | undefined): string {
  if (!savedAt) return '';
  const diffSec = Math.floor((Date.now() - savedAt) / 1000);
  if (diffSec < 5) return '방금';
  if (diffSec < 60) return `${diffSec}초 전`;
  const mins = Math.floor(diffSec / 60);
  if (mins < 60) return `${mins}분 전`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}시간 전`;
  return '오래 전';
}

/**
 * Wizard 공통 레이아웃 — 헤더(정보) / 컨텐츠(스크롤) / 하단 sticky action bar 3-zone.
 *
 * 이전 디자인은 헤더 한 줄에 액션을 몰아 위계가 무너졌음.
 * 새 디자인 원칙:
 * - 헤더: 식별 정보 (title + step + 상태 chip + 자동저장 상태). 액션 없음.
 * - 컨텐츠: 입력 폼. 자유 스크롤.
 * - 하단 bar: 모든 액션 (이전 / 임시저장 / primary / ⋮). 컨텐츠 스크롤과 무관하게 항상 노출.
 *
 * "사용자는 화면 아래에서 다음 행동을 찾고, 헤더는 맥락을 읽는 공간으로 남는다"
 */
export function WizardShell({
  title, mode = 'create', steps, activeIndex, onStepChange,
  children, headerInfo, actions,
  primaryAction, menu, onPrev, onNext, nextDisabled,
  saveStatus, savedAt,
}: WizardShellProps) {
  const isLast = activeIndex === steps.length - 1;
  const currentStep = steps[activeIndex];
  const isEdit = mode === 'edit';

  return (
    <div className="flex flex-col h-full">
      <div className="flex flex-1 overflow-hidden">
        {/* 좌측 세로 stepper (컴팩트 200px) */}
        <aside className="w-[200px] shrink-0 border-r border-[var(--border-default)] p-3 bg-[var(--surface-default)]">
          <StepProgress steps={steps} activeIndex={activeIndex} onStepClick={onStepChange} />
        </aside>

        {/* 우측 form 컬럼 — 헤더 + 스크롤 컨텐츠 + 하단 sticky bar */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {/* 스크롤 가능한 본문 (헤더 + 컨텐츠) */}
          <div className="flex-1 overflow-y-auto">
            <div className="max-w-[760px] mx-auto px-6 py-5">
              {/* 헤더 — 정보 전용 (액션 없음) */}
              <div className="flex items-center justify-between gap-4 mb-5 pb-4 border-b border-[var(--border-default)]">
                <div className="min-w-0">
                  {title && (
                    <p className="text-[var(--app-text-micro)] font-medium text-[var(--text-disabled)] mb-0.5">
                      {title}
                    </p>
                  )}
                  <h1 className="text-[var(--text-lg)] font-bold text-[var(--text-default)] leading-tight">
                    {currentStep?.label}
                  </h1>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  {headerInfo}
                  <SaveIndicator status={saveStatus} savedAt={savedAt} />
                </div>
              </div>

              {/* Step content — activeIndex 변경 시 fade-in */}
              <div key={activeIndex} className="wizard-step-in">
                {children}
              </div>
            </div>
          </div>

          {/* 하단 sticky action bar — 모든 행동 액션 단일화 */}
          <div className="shrink-0 border-t border-[var(--border-default)] bg-[var(--surface-default)]">
            <div className="max-w-[760px] mx-auto px-6 py-3 flex items-center justify-between gap-3">
              {/* 좌측: 이전 (create 모드 + Step 2 이상) */}
              <div className="flex items-center">
                {!isEdit && activeIndex > 0 && (
                  <Button variant="secondary" size="sm" onClick={onPrev} disabled={!onPrev}>
                    <ArrowLeft size={13} /> 이전
                  </Button>
                )}
              </div>

              {/* 우측: secondary actions → primary CTA → ⋮ menu */}
              <div className="flex items-center gap-2">
                {actions}
                {!isEdit && !isLast ? (
                  <Button variant="primary" size="sm" onClick={onNext} disabled={nextDisabled}>
                    다음 <ArrowRight size={13} />
                  </Button>
                ) : (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={primaryAction.onClick}
                    disabled={primaryAction.disabled || primaryAction.loading}
                  >
                    {primaryAction.loading ? '저장 중...' : primaryAction.label}
                  </Button>
                )}
                {menu}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

/**
 * 자동저장 인디케이터.
 *
 * 정직성 원칙: 자동저장은 본문/i18n 만 커버 (variants 는 명시 저장 필요).
 * 'saved' 라벨은 "기본 정보 저장됨" 으로 — 사용자가 옵션까지 저장됐다고 오인하지 않도록.
 */
function SaveIndicator({ status, savedAt }: { status?: 'idle' | 'saving' | 'saved' | 'error'; savedAt?: number | null }) {
  if (!status || status === 'idle') return null;
  if (status === 'saving') {
    return (
      <span className="inline-flex items-center gap-1 text-[var(--app-text-micro)] text-[var(--text-disabled)]">
        <span className="w-1.5 h-1.5 rounded-full bg-[var(--text-disabled)] animate-pulse" />
        저장 중…
      </span>
    );
  }
  if (status === 'error') {
    return (
      <span className="text-[var(--app-text-micro)] text-[var(--color-danger)]">저장 실패</span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-[var(--app-text-micro)] text-[var(--color-success)]">
      <Check size={11} />
      기본 정보 저장됨{savedAt ? ` · ${formatSavedAgo(savedAt)}` : ''}
    </span>
  );
}

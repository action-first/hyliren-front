'use client';

import { type ButtonHTMLAttributes, forwardRef } from 'react';

type Variant = 'primary' | 'accent' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg' | 'xl';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
}

/*
  한옌리런 Button variant 가이드 (2026-04-22 현행화)

  실제 사용 현황 기반으로 역할 재정의. 명명은 Airbnb 토큰을 참고하되
  프로덕트 내부에서의 "의미"는 아래 우선순위로 사용한다:

  - accent  → 🔴 **주 CTA**. 진입·전환·결제 등 가장 중요한 단 하나의 액션.
              예) "AI와 상담 시작하기", "제출하기", "선택 완료"
              한 화면에 두 개 이상 금지 — 사용자 시선이 분산된다.
  - primary → 🟤 주 CTA 에 해당하지 않는 강조 버튼.
              예) "편집", "상세 보기" 같은 탐색 액션, BO/PO 관리 버튼.
              near-black 으로 전환보다 "액션"의 무게를 전달한다.
  - secondary → ⚪ outlined, 반대·부가 옵션. "취소", "나중에 하기".
  - ghost   → 투명 버튼. 링크에 가까운 탐색. "더보기", "돌아가기".
  - danger  → 🔴 파괴적 액션. 삭제·로그아웃 확정 등. 다이얼로그 안에서만 노출 권장.

  참고: 네이밍이 "primary=main action" 이라는 일반 컨벤션과 엇갈리므로,
  새 컴포넌트 작업 시 이 주석을 반드시 확인할 것. 본개발 시점에
  (a) accent → primary 승격 리네임 또는 (b) 현 네이밍 유지 중 선택 필요.
*/
const variantStyles: Record<Variant, string> = {
  primary: 'bg-[var(--color-text,#202223)] text-[var(--color-text-inverse,#fff)] hover:opacity-90',
  accent: 'bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)]',
  secondary: 'bg-transparent text-[var(--color-text,#202223)] border border-[var(--color-border,#E1E3E5)] hover:bg-[var(--color-bg-secondary,#F1F2F3)]',
  ghost: 'bg-transparent text-[var(--color-text-secondary,#6D7175)] hover:bg-[var(--color-bg-secondary,#F1F2F3)]',
  danger: 'bg-[var(--color-danger,#D72C0D)] text-white hover:opacity-90',
};

const sizeStyles: Record<Size, string> = {
  sm: 'h-8 px-3 text-xs rounded-[var(--input-radius,6px)]',
  md: 'h-9 px-4 text-sm rounded-[var(--input-radius,6px)]',
  lg: 'h-10 px-5 text-sm rounded-[var(--input-radius,6px)] font-medium',
  xl: 'h-12 px-6 text-base rounded-[var(--app-radius,8px)] font-semibold',
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', fullWidth = false, className = '', children, ...props }, ref) => (
    <button
      ref={ref}
      className={`
        inline-flex items-center justify-center gap-2 font-medium
        transition-all duration-150
        disabled:opacity-[var(--opacity-disabled)] disabled:cursor-not-allowed
        cursor-pointer select-none
        active:scale-[0.98]
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--input-border-focus)] focus-visible:ring-offset-2
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `}
      {...props}
    >
      {children}
    </button>
  )
);

Button.displayName = 'Button';
export { Button };
export type { ButtonProps };

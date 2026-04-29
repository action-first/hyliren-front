import type { ReactNode } from 'react';
import { ArrowLeft } from 'lucide-react';

export interface AdminPageProps {
  /** 사이드바 컴포넌트 */
  sidebar: ReactNode;
  /** 페이지 제목 */
  title: string;
  /** 탑바 우측 액션 버튼 */
  actions?: ReactNode;
  /** 페이지 콘텐츠 */
  children: ReactNode;
  /** 레이아웃 클래스 프리픽스 (bo | po) */
  prefix?: 'bo' | 'po' | 'admin';
  /** 지정 시 title 좌측에 뒤로가기 버튼 노출. 클릭 시 호출. */
  onBack?: () => void;
  /** Back button aria-label (스크린 리더). 미지정 시 한국어 기본값. */
  backLabel?: string;
}

export function AdminPage({ sidebar, title, actions, children, prefix = 'admin', onBack, backLabel = '뒤로 가기' }: AdminPageProps) {
  return (
    <div className={`${prefix}-layout`}>
      {sidebar}
      <div className={`${prefix}-main`}>
        <div className={`${prefix}-topbar`}>
          <div className={`${prefix}-topbar-leading`}>
            {onBack && (
              <button
                type="button"
                onClick={onBack}
                className={`${prefix}-topbar-back`}
                aria-label={backLabel}
              >
                <ArrowLeft size={18} />
              </button>
            )}
            <span className={`${prefix}-topbar-title`}>{title}</span>
          </div>
          {actions && <div className={`${prefix}-topbar-actions`}>{actions}</div>}
        </div>
        <div className={`${prefix}-content`}>
          {children}
        </div>
      </div>
    </div>
  );
}

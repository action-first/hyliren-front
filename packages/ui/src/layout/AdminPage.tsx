import type { ReactNode } from 'react';

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
}

export function AdminPage({ sidebar, title, actions, children, prefix = 'admin' }: AdminPageProps) {
  return (
    <div className={`${prefix}-layout`}>
      {sidebar}
      <div className={`${prefix}-main`}>
        <div className={`${prefix}-topbar`}>
          <span className={`${prefix}-topbar-title`}>{title}</span>
          {actions && <div className={`${prefix}-topbar-actions`}>{actions}</div>}
        </div>
        <div className={`${prefix}-content`}>
          {children}
        </div>
      </div>
    </div>
  );
}

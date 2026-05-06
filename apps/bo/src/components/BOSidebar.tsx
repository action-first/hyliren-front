'use client';

import Link from 'next/link';
import {
  LayoutDashboard,
  Users,
  Building2,
  FileText,
  TrendingUp,
  Activity,
  CreditCard,
  BookOpen,
  CircleUserRound,
  ShieldCheck,
  LogOut,
} from 'lucide-react';
import { useBOAuthStore } from '@/store/bo-auth';
import { useToastStore } from '@/store/toast';

const NAV = [
  { href: '/dashboard', icon: LayoutDashboard, label: '대시보드' },
  { href: '/events', icon: Activity, label: '이벤트 로그' },
  { href: '/buyers', icon: Users, label: '고객 관리' },
  { href: '/partners', icon: Building2, label: '병원 관리' },
  { href: '/proposals', icon: FileText, label: '제안서 관리' },
  { href: '/payments', icon: CreditCard, label: '결제 내역' },
  { href: '/revenue', icon: TrendingUp, label: '매출 현황' },
  { href: '/articles', icon: BookOpen, label: '아티클 관리' },
] as const;

export function BOSidebar({ active }: { active: string }) {
  const member = useBOAuthStore((s) => s.member);
  const logout = useBOAuthStore((s) => s.logout);
  const { showToast } = useToastStore();

  async function handleLogout() {
    try {
      await logout();
      showToast('로그아웃되었습니다.', 'info');
    } catch {
      showToast('서버 로그아웃 실패. 세션은 정리되었습니다.', 'info');
    }
  }

  return (
    <aside className="bo-sidebar">
      <Link href="/dashboard" className="bo-sidebar-logo" aria-label="mimyo Business Office">
        Business Office
      </Link>
      <nav className="bo-sidebar-nav">
        {NAV.map((n) => {
          const Icon = n.icon;
          const isActive = active === n.href;
          return (
            <Link
              key={n.href}
              href={n.href}
              className={`bo-sidebar-link ${isActive ? 'bo-sidebar-link--active' : ''}`}
            >
              <Icon size={18} strokeWidth={isActive ? 2 : 1.5} />
              {n.label}
            </Link>
          );
        })}
        <div className="bo-sidebar-footer">
          <div className="bo-sidebar-account" aria-label="현재 로그인한 BO 계정">
            <div className="bo-sidebar-account__avatar">
              <CircleUserRound size={18} />
            </div>
            <div className="bo-sidebar-account__body">
              <div className="bo-sidebar-account__topline">
                <strong className="bo-sidebar-account__name">
                  {member?.name ?? '세션 확인 중'}
                </strong>
                <span className="bo-sidebar-account__verified">
                  <ShieldCheck size={12} />
                  BO
                </span>
              </div>
              <span className="bo-sidebar-account__identity">
                {member?.email ?? ''}
              </span>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              aria-label="로그아웃"
              className="bo-sidebar-account__logout"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 28,
                height: 28,
                border: 'none',
                background: 'transparent',
                color: 'var(--text-subdued)',
                cursor: 'pointer',
                borderRadius: 6,
              }}
            >
              <LogOut size={14} />
            </button>
          </div>
        </div>
      </nav>
    </aside>
  );
}

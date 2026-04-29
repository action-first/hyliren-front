'use client';

import Link from 'next/link';
import {
  LayoutDashboard,
  Building2,
  Stethoscope,
  MessageSquareText,
  Activity,
  CreditCard,
  CircleUserRound,
  ShieldCheck,
  Plus,
  LogOut,
} from 'lucide-react';
import { useCreditBalance } from '@/hooks/queries/credits';
import { useMyPartnerProfile } from '@/hooks/queries/partner-profile';
import { usePOAuthStore } from '@/store/po-auth';
import { useToastStore } from '@/store/toast';

const NAV = [
  { href: '/dashboard', icon: LayoutDashboard, label: '대시보드' },
  { href: '/concerns', icon: MessageSquareText, label: '고민' },
  { href: '/activity', icon: Activity, label: '활동 내역' },
  { href: '/treatments', icon: Stethoscope, label: '시술 관리' },
  { href: '/profile', icon: Building2, label: '파트너 정보' },
] as const;

export function POSidebar({ active }: { active: string }) {
  // 잔액 = real BE (BE PR #22). 미존재 회원도 0 반환이라 fallback 안전.
  const balanceQ = useCreditBalance();
  const balance = balanceQ.data?.balance ?? 0;
  const member = usePOAuthStore(s => s.member);
  // 프로필 = real BE (BE PR #23). 미존재 회원도 빈 기본값 응답.
  const profileQ = useMyPartnerProfile();
  const profile = profileQ.data;
  const logout = usePOAuthStore(s => s.logout);
  const { showToast } = useToastStore();

  // 결제 PG 미연결 — 별도 프로젝트로 진행 예정. 충전은 운영 채널로 유도.
  function handleChargeRequest() {
    showToast('크레딧 충전은 관리자에게 문의해주세요.', 'info');
  }

  async function handleLogout() {
    try {
      await logout();
      showToast('로그아웃되었습니다.', 'info');
    } catch {
      showToast('로그아웃되었습니다. 일부 정리는 재접속 시 자동 처리됩니다.', 'warning');
    }
  }

  return (
    <>
      <aside className="po-sidebar">
        <Link href="/dashboard" className="po-sidebar-logo">Partner Office</Link>
        <nav className="po-sidebar-nav">
          {NAV.map(n => {
            const Icon = n.icon;
            const isActive = active === n.href;
            return (
              <Link
                key={n.href}
                href={n.href}
                className={`po-sidebar-link ${isActive ? 'po-sidebar-link--active' : ''}`}
              >
                <Icon size={18} strokeWidth={isActive ? 2 : 1.5} />
                {n.label}
              </Link>
            );
          })}
          <div className="po-sidebar-footer">
            <div className="po-sidebar-credit">
              <div className="po-sidebar-credit__label">
                <CreditCard size={12} />
                <span>크레딧 잔액</span>
              </div>
              <div className="po-sidebar-credit__row">
                <div className="po-sidebar-credit__value">
                  <span>{balance}</span>
                  <span className="po-sidebar-credit__unit">CR</span>
                </div>
                <button
                  type="button"
                  onClick={handleChargeRequest}
                  style={{
                    display: 'inline-flex', alignItems: 'center',
                    gap: 'var(--spacing-1)',
                    padding: '5px var(--spacing-3)',
                    borderRadius: 'var(--input-radius, 6px)',
                    fontSize: 'var(--text-sm)',
                    fontWeight: 'var(--font-semibold)',
                    fontFamily: 'inherit',
                    background: 'var(--interactive-default)', color: '#fff',
                    border: 'none', cursor: 'pointer',
                    transition: 'opacity 150ms',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
                  onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
                >
                  <Plus size={12} />
                  충전
                </button>
              </div>
            </div>

            <div className="po-sidebar-account">
              <Link href="/profile" className="po-sidebar-account__profile" aria-label="현재 로그인한 파트너 계정 정보 보기">
                <div className="po-sidebar-account__avatar">
                  <CircleUserRound size={18} />
                </div>
                <div className="po-sidebar-account__body">
                  <div className="po-sidebar-account__topline">
                    <strong className="po-sidebar-account__hospital">
                      {profile?.i18n?.ko?.hospitalName ?? '파트너 계정'}
                    </strong>
                    {profile?.verified ? (
                      <span className="po-sidebar-account__verified">
                        <ShieldCheck size={12} />
                        인증
                      </span>
                    ) : null}
                  </div>
                  <span className="po-sidebar-account__identity">
                    {member?.name ?? '계정 정보 없음'}
                    {member?.email ? ` · ${member.email}` : ''}
                  </span>
                </div>
              </Link>
              {member ? (
                <button
                  type="button"
                  onClick={handleLogout}
                  aria-label="로그아웃"
                  className="po-sidebar-account__logout"
                >
                  <LogOut size={14} />
                </button>
              ) : (
                <Link href="/login" className="po-sidebar-account__login">로그인</Link>
              )}
            </div>
          </div>
        </nav>
      </aside>
    </>
  );
}

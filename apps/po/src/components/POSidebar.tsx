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
import { Wordmark, pickWordmarkLocale } from '@hyliren/ui';
import { useCreditBalance } from '@/hooks/queries/credits';
import { useMyPartnerProfile } from '@/hooks/queries/partner-profile';
import { usePOAuthStore } from '@/store/po-auth';
import { useToastStore } from '@/store/toast';
import { useLocaleStore } from '@/store/locale';

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
  const t = useLocaleStore(s => s.t);
  const locale = useLocaleStore(s => s.locale);
  const wordmarkLocale = pickWordmarkLocale(locale);

  const NAV = [
    { href: '/dashboard', icon: LayoutDashboard, label: t('po.navDashboard') },
    { href: '/concerns', icon: MessageSquareText, label: t('po.navConcerns') },
    { href: '/activity', icon: Activity, label: t('po.navActivity') },
    { href: '/treatments', icon: Stethoscope, label: t('po.navTreatments') },
    { href: '/profile', icon: Building2, label: t('po.navProfile') },
  ];

  // 결제 PG 미연결 — 별도 프로젝트로 진행 예정. 충전은 운영 채널로 유도.
  function handleChargeRequest() {
    showToast(t('po.creditChargeContact'), 'info');
  }

  async function handleLogout() {
    try {
      await logout();
      showToast(t('po.logoutSuccess'), 'info');
    } catch {
      showToast(t('po.logoutPartial'), 'warning');
    }
  }

  return (
    <>
      <aside className="po-sidebar">
        <Link
          href="/dashboard"
          className="po-sidebar-logo"
          aria-label={wordmarkLocale === 'zh' ? 'meimiao Partner Office' : 'mimyo Partner Office'}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}
        >
          <Wordmark locale={wordmarkLocale} fontSize={22} color="currentColor" />
          <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', opacity: 0.55 }}>
            Partner
          </span>
        </Link>
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
                <span>{t('po.creditBalance')}</span>
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
                  {t('po.charge')}
                </button>
              </div>
            </div>

            <div className="po-sidebar-account">
              <Link href="/profile" className="po-sidebar-account__profile" aria-label={t('po.accountAriaLabel')}>
                <div className="po-sidebar-account__avatar">
                  <CircleUserRound size={18} />
                </div>
                <div className="po-sidebar-account__body">
                  <div className="po-sidebar-account__topline">
                    <strong className="po-sidebar-account__hospital">
                      {profile?.i18n?.ko?.hospitalName ?? t('po.fallbackPartnerAccount')}
                    </strong>
                    {profile?.verified ? (
                      <span className="po-sidebar-account__verified">
                        <ShieldCheck size={12} />
                        {t('common.verified')}
                      </span>
                    ) : null}
                  </div>
                  <span className="po-sidebar-account__identity">
                    {member?.name ?? t('po.accountNoInfo')}
                    {member?.email ? ` · ${member.email}` : ''}
                  </span>
                </div>
              </Link>
              {member ? (
                <button
                  type="button"
                  onClick={handleLogout}
                  aria-label={t('po.logoutAria')}
                  className="po-sidebar-account__logout"
                >
                  <LogOut size={14} />
                </button>
              ) : (
                <Link href="/login" className="po-sidebar-account__login">{t('po.loginButton')}</Link>
              )}
            </div>
          </div>
        </nav>
      </aside>
    </>
  );
}

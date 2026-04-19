'use client';

import Link from 'next/link';
import {
  LayoutDashboard,
  Building2,
  Stethoscope,
  MessageSquareText,
  FileText,
  CreditCard,
  CircleUserRound,
  ShieldCheck,
} from 'lucide-react';
import { useCreditsStore } from '@/store/credits';
import { usePOAuthStore } from '@/store/po-auth';

const NAV = [
  { href: '/dashboard', icon: LayoutDashboard, label: '대시보드' },
  { href: '/profile', icon: Building2, label: '파트너 정보' },
  { href: '/treatments', icon: Stethoscope, label: '시술 관리' },
  { href: '/concerns', icon: MessageSquareText, label: '고민 리스트' },
  { href: '/proposals', icon: FileText, label: '발송 내역' },
  { href: '/credits', icon: CreditCard, label: '크레딧' },
] as const;

export function POSidebar({ active }: { active: string }) {
  const balance = useCreditsStore(s => s.balance);
  const member = usePOAuthStore(s => s.member);
  const profile = usePOAuthStore(s => s.profile);

  return (
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
              <CreditCard size={13} />
              <span>크레딧</span>
            </div>
            <div className="po-sidebar-credit__value">
              <span>{balance}</span>
              <span className="po-sidebar-credit__unit">CR</span>
            </div>
          </div>

          <Link href="/profile" className="po-sidebar-account" aria-label="현재 로그인한 파트너 계정 정보 보기">
            <div className="po-sidebar-account__avatar">
              <CircleUserRound size={18} />
            </div>
            <div className="po-sidebar-account__body">
              <div className="po-sidebar-account__topline">
                <strong className="po-sidebar-account__hospital">
                  {profile?.hospitalName ?? '파트너 계정'}
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
        </div>
      </nav>
    </aside>
  );
}

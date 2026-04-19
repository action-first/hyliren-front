'use client';

import Link from 'next/link';
import { MOCK_MEMBERS } from '@hyliren/shared';
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
} from 'lucide-react';

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
  const adminMember = MOCK_MEMBERS.find(member => member.role === 'admin');

  return (
    <aside className="bo-sidebar">
      <Link href="/dashboard" className="bo-sidebar-logo">Business Office</Link>
      <nav className="bo-sidebar-nav">
        {NAV.map(n => {
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
          <Link href="/dashboard" className="bo-sidebar-account" aria-label="현재 로그인한 BO 계정 정보 보기">
            <div className="bo-sidebar-account__avatar">
              <CircleUserRound size={18} />
            </div>
            <div className="bo-sidebar-account__body">
              <div className="bo-sidebar-account__topline">
                <strong className="bo-sidebar-account__name">
                  {adminMember?.name ?? '운영 계정'}
                </strong>
                <span className="bo-sidebar-account__verified">
                  <ShieldCheck size={12} />
                  BO
                </span>
              </div>
              <span className="bo-sidebar-account__identity">
                {adminMember?.email ?? 'admin@hyliren.com'}
              </span>
            </div>
          </Link>
        </div>
      </nav>
    </aside>
  );
}

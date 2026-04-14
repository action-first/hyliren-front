'use client';

import Link from 'next/link';
import { LayoutDashboard, Users, Building2, FileText, TrendingUp } from 'lucide-react';

const NAV = [
  { href: '/dashboard', icon: LayoutDashboard, label: '대시보드' },
  { href: '/buyers', icon: Users, label: '고객 관리' },
  { href: '/partners', icon: Building2, label: '병원 관리' },
  { href: '/proposals', icon: FileText, label: '제안서 관리' },
  { href: '/revenue', icon: TrendingUp, label: '매출 현황' },
] as const;

export function BOSidebar({ active }: { active: string }) {
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
      </nav>
    </aside>
  );
}

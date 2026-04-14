'use client';

import Link from 'next/link';
import { LayoutDashboard, MessageSquareText, FileText, CreditCard } from 'lucide-react';

const NAV = [
  { href: '/dashboard', icon: LayoutDashboard, label: '대시보드' },
  { href: '/concerns', icon: MessageSquareText, label: '고민 리스트' },
  { href: '/proposals', icon: FileText, label: '발송 내역' },
  { href: '/credits', icon: CreditCard, label: '크레딧' },
] as const;

export function POSidebar({ active }: { active: string }) {
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
      </nav>
    </aside>
  );
}

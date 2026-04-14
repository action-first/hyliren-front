'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, FileText, BookOpen, User } from 'lucide-react';

const TABS = [
  { href: '/', icon: Home, label: '홈' },
  { href: '/proposals', icon: FileText, label: '제안서' },
  { href: '/articles', icon: BookOpen, label: '아티클' },
  { href: '/mypage', icon: User, label: '마이' },
] as const;

export function FOTabBar() {
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  }

  return (
    <nav className="fo-tabbar">
      {TABS.map(tab => {
        const Icon = tab.icon;
        const active = isActive(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`fo-tab ${active ? 'fo-tab--active' : ''}`}
          >
            <Icon size={22} strokeWidth={active ? 2.5 : 1.5} />
            <span className="fo-tab-label">{tab.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

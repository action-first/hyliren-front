'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, LayoutDashboard, Scale, BookOpen, User } from 'lucide-react';
import { useLocaleStore } from '@/store/locale';

const TAB_DEFS = [
  { href: '/', icon: Home, key: 'nav.home' },
  { href: '/dashboard', icon: LayoutDashboard, key: 'nav.myConsult' },
  { href: '/decision', icon: Scale, key: 'nav.decision' },
  { href: '/articles', icon: BookOpen, key: 'nav.articles' },
  { href: '/mypage', icon: User, key: 'nav.my' },
];

export function FOTabBar() {
  const pathname = usePathname();
  const t = useLocaleStore(s => s.t);

  function isActive(href: string) {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  }

  return (
    <nav className="fo-tabbar">
      {TAB_DEFS.map(tab => {
        const Icon = tab.icon;
        const active = isActive(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`fo-tab ${active ? 'fo-tab--active' : ''}`}
          >
            <Icon size={20} strokeWidth={active ? 2.5 : 1.5} />
            <span className="fo-tab-label">{t(tab.key)}</span>
          </Link>
        );
      })}
    </nav>
  );
}

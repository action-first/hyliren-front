import Link from 'next/link';

const NAV = [
  { href: '/dashboard', icon: '📊', label: '대시보드' },
  { href: '/concerns', icon: '💬', label: '고민 리스트' },
  { href: '/proposals', icon: '📄', label: '발송 내역' },
  { href: '/credits', icon: '💳', label: '크레딧' },
];

export function POSidebar({ active }: { active: string }) {
  return (
    <aside className="po-sidebar">
      <Link href="/dashboard" className="po-sidebar-logo">Partner Office</Link>
      <nav className="po-sidebar-nav">
        {NAV.map(n => (
          <Link
            key={n.href}
            href={n.href}
            className={`po-sidebar-link ${active === n.href ? 'po-sidebar-link--active' : ''}`}
          >
            <span className="po-sidebar-link-icon">{n.icon}</span>
            {n.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}

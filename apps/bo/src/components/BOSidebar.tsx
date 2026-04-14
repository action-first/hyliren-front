import Link from 'next/link';

const NAV = [
  { href: '/dashboard', icon: '📊', label: '대시보드' },
  { href: '/buyers', icon: '👤', label: '고객 관리' },
  { href: '/partners', icon: '🏥', label: '병원 관리' },
  { href: '/proposals', icon: '📄', label: '제안서 관리' },
  { href: '/revenue', icon: '💰', label: '매출 현황' },
];

export function BOSidebar({ active }: { active: string }) {
  return (
    <aside className="bo-sidebar">
      <Link href="/dashboard" className="bo-sidebar-logo">Business Office</Link>
      <nav className="bo-sidebar-nav">
        {NAV.map(n => (
          <Link
            key={n.href}
            href={n.href}
            className={`bo-sidebar-link ${active === n.href ? 'bo-sidebar-link--active' : ''}`}
          >
            <span style={{ width: '1.25rem', textAlign: 'center', flexShrink: 0 }}>{n.icon}</span>
            {n.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}

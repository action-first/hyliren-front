'use client';

import Link from 'next/link';
import { Bell } from 'lucide-react';

export function FOHeader() {
  return (
    <header className="fo-header">
      <Link href="/" className="fo-header-logo">
        <span className="fo-logo-mark">韩</span>
        <span className="fo-logo-text">한옌리런</span>
      </Link>
      <div className="fo-header-actions">
        <button className="fo-header-icon-btn">
          <Bell size={20} strokeWidth={1.5} />
        </button>
      </div>
    </header>
  );
}

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Bell, User } from 'lucide-react';
import { MOCK_PROPOSALS } from '@hyliren/shared';
import { useAuthStore } from '@/store/auth';
import { AuthModal } from '@/components/auth/AuthModal';

export function FOHeader() {
  const { isLoggedIn, user } = useAuthStore();
  const [showAuth, setShowAuth] = useState(false);
  const unreadCount = MOCK_PROPOSALS.filter(p => p.isActive && p.status === 'sent' && !p.viewedAt).length;

  return (
    <>
      <header className="fo-header">
        <Link href="/" className="fo-header-logo">
          <span className="fo-logo-mark">韩</span>
          <span className="fo-logo-text">한옌리런</span>
        </Link>
        <div className="fo-header-actions">
          <Link href="/decision" className="fo-header-icon-btn relative">
            <Bell size={20} strokeWidth={1.5} />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-[16px] rounded-full bg-[var(--color-primary)] text-white text-[9px] font-bold flex items-center justify-center px-1">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </Link>

          {isLoggedIn ? (
            <Link href="/mypage" className="fo-header-icon-btn">
              <div className="w-7 h-7 rounded-full fo-gradient-accent-br flex items-center justify-center text-[11px] font-bold text-[var(--color-primary)]">
                {user?.name?.[0] || 'U'}
              </div>
            </Link>
          ) : (
            <button type="button" onClick={() => setShowAuth(true)}
              className="fo-header-icon-btn border-0 bg-transparent cursor-pointer p-0">
              <User size={20} strokeWidth={1.5} />
            </button>
          )}
        </div>
      </header>

      <AuthModal
        open={showAuth}
        onSuccess={() => setShowAuth(false)}
        onClose={() => setShowAuth(false)}
      />
    </>
  );
}

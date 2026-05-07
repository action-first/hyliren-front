'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Bell, User } from 'lucide-react';
import { Wordmark, pickWordmarkLocale } from '@hyliren/ui';
import { useAuthStore } from '@/store/auth';
import { useLocaleStore } from '@/store/locale';
import { AuthModal } from '@/components/auth/AuthModal';

export function FOHeader() {
  const { isLoggedIn, user } = useAuthStore();
  const locale = useLocaleStore(s => s.locale);
  const wordmarkLocale = pickWordmarkLocale(locale);
  const [showAuth, setShowAuth] = useState(false);
  // 미읽은 제안서 카운트는 customer backend 의 "내 모든 제안" 집계 엔드포인트
  // 추가 후 연결 (현재 customer API 는 concernId 별 listProposals 만 제공).
  // 임시로 0 — 뱃지 숨김 처리.
  const unreadCount = 0;

  return (
    <>
      <header className="fo-header">
        <Link href="/" className="fo-header-logo" aria-label={wordmarkLocale === 'zh' ? 'meimiao' : 'mimyo'}>
          <Wordmark locale={wordmarkLocale} fontSize={22} color="var(--color-ink, #0A0A0A)" />
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

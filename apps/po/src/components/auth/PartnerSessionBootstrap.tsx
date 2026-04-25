'use client';

import { useEffect } from 'react';
import { usePOAuthStore } from '@/store/po-auth';
import { subscribePartnerStorageSync } from '@/lib/auth/session';

export function PartnerSessionBootstrap() {
  const refreshSession = usePOAuthStore(s => s.refreshSession);
  const setMember = usePOAuthStore(s => s.setMember);

  useEffect(() => {
    void refreshSession();
    return subscribePartnerStorageSync(
      () => setMember(null),
      () => { void refreshSession(); },
    );
  }, [refreshSession, setMember]);

  return null;
}

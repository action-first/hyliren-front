'use client';

import { Eye, EyeOff, FileEdit } from 'lucide-react';
import type { ProcedureStatus } from '@hyliren/shared';
import { useLocaleStore } from '@/store/locale';

interface Props {
  status: ProcedureStatus;
}

/**
 * 시술 상태 chip — 헤더 정보 영역에서 현재 status 를 한눈에 표시.
 * 색상 토큰: success (공개), warning (임시저장), neutral (비공개).
 */
export function StatusChip({ status }: Props) {
  const t = useLocaleStore(s => s.t);
  if (status === 'published') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[var(--app-text-micro)] font-medium bg-[var(--color-success-soft)] text-[var(--color-success)] border border-[var(--color-success)]">
        <Eye size={11} />
        {t('po.statusPublished')}
      </span>
    );
  }
  if (status === 'archived') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[var(--app-text-micro)] font-medium bg-[var(--surface-subdued)] text-[var(--text-subdued)] border border-[var(--border-default)]">
        <EyeOff size={11} />
        {t('po.statusArchived')}
      </span>
    );
  }
  // draft
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[var(--app-text-micro)] font-medium bg-[var(--color-warning-soft)] text-[var(--color-warning)] border border-[var(--color-warning)]">
      <FileEdit size={11} />
      {t('po.statusDraft')}
    </span>
  );
}

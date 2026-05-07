'use client';

import { Suspense } from 'react';
import { ConcernFlow } from '@/components/consult/ConcernFlow';

export default function ConsultPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-6 h-6 rounded-full border-2 border-[var(--color-primary)] border-t-transparent animate-spin" />
      </div>
    }>
      <ConcernFlow />
    </Suspense>
  );
}

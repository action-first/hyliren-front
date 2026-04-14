'use client';

import { Suspense } from 'react';
import { ConcernFlow } from '@/components/consult/ConcernFlow';

export default function ConsultPage() {
  return (
    <Suspense>
      <ConcernFlow />
    </Suspense>
  );
}

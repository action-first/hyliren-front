'use client';

/**
 * `/concerns/[id]/propose` 는 detail 페이지의 ProposeFormSheet 로 통합됨.
 * 외부에서 들어오는 deep link 호환을 위해 `/concerns/[id]?propose=1` 로 redirect.
 * detail 페이지가 query 를 보고 sheet 를 자동 오픈한다.
 */

import { use, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Props {
  params: Promise<{ id: string }>;
}

export default function ProposeRedirect({ params }: Props) {
  const { id } = use(params);
  const router = useRouter();
  useEffect(() => {
    router.replace(`/concerns/${id}?propose=1`);
  }, [id, router]);
  return null;
}

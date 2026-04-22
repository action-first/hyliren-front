import { MobileCardListSkeleton } from '@hyliren/ui';

/**
 * 전역 라우트 레벨 loading.tsx.
 * 디자인 시스템의 MobileCardListSkeleton 을 재사용 — 하드코딩된 색상·애니메이션 제거.
 */
export default function Loading() {
  return <MobileCardListSkeleton count={3} />;
}

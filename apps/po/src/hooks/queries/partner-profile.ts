import { useQuery } from '@tanstack/react-query';
import { partnerProfileApi } from '@/lib/api/partner-profile';
import { queryKeys } from './keys';

/**
 * 본인 파트너 프로필.
 *
 * BE 가 미존재 회원도 빈 기본값 반환 → undefined 처리 부담 없음.
 * POSidebar / /profile 페이지가 공유 — 한 번 fetch 후 5분 cache hit.
 */
export function useMyPartnerProfile() {
  return useQuery({
    queryKey: queryKeys.partnerProfile.me(),
    queryFn: () => partnerProfileApi.getMy(),
  });
}

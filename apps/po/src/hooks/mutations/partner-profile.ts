import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  partnerProfileApi,
  type PartnerProfileWire,
  type UpdatePartnerProfileBody,
} from '@/lib/api/partner-profile';
import { queryKeys } from '@/hooks/queries/keys';

/**
 * 본인 파트너 프로필 수정 (upsert).
 *
 * 성공 시 query cache 를 직접 set — round-trip 회피 + UI 즉시 반영.
 */
export function useUpdateMyPartnerProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: UpdatePartnerProfileBody) => partnerProfileApi.updateMy(body),
    onSuccess: (data: PartnerProfileWire) => {
      queryClient.setQueryData(queryKeys.partnerProfile.me(), data);
    },
  });
}

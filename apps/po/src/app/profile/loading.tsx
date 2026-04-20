import { AdminPage, DetailPageSkeleton } from '@hyliren/ui';
import { POSidebar } from '@/components/POSidebar';

export default function Loading() {
  return (
    <AdminPage sidebar={<POSidebar active="/profile" />} title="파트너 정보" prefix="po">
      <DetailPageSkeleton />
    </AdminPage>
  );
}

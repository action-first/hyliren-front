import { AdminPage, DetailPageSkeleton } from '@hyliren/ui';
import { POSidebar } from '@/components/POSidebar';

export default function Loading() {
  return (
    <AdminPage sidebar={<POSidebar active="/concerns" />} title="고민 상세" prefix="po">
      <DetailPageSkeleton />
    </AdminPage>
  );
}

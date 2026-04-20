import { AdminPage, DetailPageSkeleton } from '@hyliren/ui';
import { POSidebar } from '@/components/POSidebar';

export default function Loading() {
  return (
    <AdminPage sidebar={<POSidebar active="/proposals" />} title="제안서 상세" prefix="po">
      <DetailPageSkeleton />
    </AdminPage>
  );
}

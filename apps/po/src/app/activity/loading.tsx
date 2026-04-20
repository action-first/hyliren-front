import { AdminPage, ListPageSkeleton } from '@hyliren/ui';
import { POSidebar } from '@/components/POSidebar';

export default function Loading() {
  return (
    <AdminPage sidebar={<POSidebar active="/activity" />} title="활동 내역" prefix="po">
      <ListPageSkeleton />
    </AdminPage>
  );
}

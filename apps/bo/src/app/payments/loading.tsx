import { AdminPage, ListPageSkeleton } from '@hyliren/ui';
import { BOSidebar } from '@/components/BOSidebar';

export default function Loading() {
  return (
    <AdminPage sidebar={<BOSidebar active="/payments" />} title="결제 내역" prefix="bo">
      <ListPageSkeleton />
    </AdminPage>
  );
}

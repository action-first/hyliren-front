import { AdminPage, ListPageSkeleton } from '@hyliren/ui';
import { BOSidebar } from '@/components/BOSidebar';

export default function Loading() {
  return (
    <AdminPage sidebar={<BOSidebar active="/buyers" />} title="고객 관리" prefix="bo">
      <ListPageSkeleton />
    </AdminPage>
  );
}

import { AdminPage, ListPageSkeleton } from '@hyliren/ui';
import { BOSidebar } from '@/components/BOSidebar';

export default function Loading() {
  return (
    <AdminPage sidebar={<BOSidebar active="/revenue" />} title="매출 현황" prefix="bo">
      <ListPageSkeleton />
    </AdminPage>
  );
}

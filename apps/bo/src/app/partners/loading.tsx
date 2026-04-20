import { AdminPage, ListPageSkeleton } from '@hyliren/ui';
import { BOSidebar } from '@/components/BOSidebar';

export default function Loading() {
  return (
    <AdminPage sidebar={<BOSidebar active="/partners" />} title="병원 관리" prefix="bo">
      <ListPageSkeleton />
    </AdminPage>
  );
}

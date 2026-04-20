import { AdminPage, ListPageSkeleton } from '@hyliren/ui';
import { BOSidebar } from '@/components/BOSidebar';

export default function Loading() {
  return (
    <AdminPage sidebar={<BOSidebar active="/events" />} title="이벤트 로그" prefix="bo">
      <ListPageSkeleton />
    </AdminPage>
  );
}

import { AdminPage, ListPageSkeleton } from '@hyliren/ui';
import { BOSidebar } from '@/components/BOSidebar';

export default function Loading() {
  return (
    <AdminPage sidebar={<BOSidebar active="/articles" />} title="아티클 관리" prefix="bo">
      <ListPageSkeleton />
    </AdminPage>
  );
}

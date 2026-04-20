import { AdminPage, ListPageSkeleton } from '@hyliren/ui';
import { BOSidebar } from '@/components/BOSidebar';

export default function Loading() {
  return (
    <AdminPage sidebar={<BOSidebar active="/proposals" />} title="제안서 관리" prefix="bo">
      <ListPageSkeleton />
    </AdminPage>
  );
}

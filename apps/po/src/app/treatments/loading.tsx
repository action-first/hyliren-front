import { AdminPage, ListPageSkeleton } from '@hyliren/ui';
import { POSidebar } from '@/components/POSidebar';

export default function Loading() {
  return (
    <AdminPage sidebar={<POSidebar active="/treatments" />} title="시술 관리" prefix="po">
      <ListPageSkeleton rows={4} />
    </AdminPage>
  );
}

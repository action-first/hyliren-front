import { AdminPage, DashboardSkeleton } from '@hyliren/ui';
import { POSidebar } from '@/components/POSidebar';

export default function Loading() {
  return (
    <AdminPage sidebar={<POSidebar active="/dashboard" />} title="대시보드" prefix="po">
      <DashboardSkeleton />
    </AdminPage>
  );
}

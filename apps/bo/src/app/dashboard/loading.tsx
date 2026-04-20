import { AdminPage, DashboardSkeleton } from '@hyliren/ui';
import { BOSidebar } from '@/components/BOSidebar';

export default function Loading() {
  return (
    <AdminPage sidebar={<BOSidebar active="/dashboard" />} title="통합 대시보드" prefix="bo">
      <DashboardSkeleton />
    </AdminPage>
  );
}

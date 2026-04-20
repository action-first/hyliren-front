import { AdminPage, DetailPageSkeleton } from '@hyliren/ui';
import { BOSidebar } from '@/components/BOSidebar';

export default function Loading() {
  return (
    <AdminPage sidebar={<BOSidebar active="/proposals" />} title="제안서 상세" prefix="bo">
      <DetailPageSkeleton />
    </AdminPage>
  );
}

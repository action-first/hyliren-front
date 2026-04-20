import { AdminPage, DetailPageSkeleton } from '@hyliren/ui';
import { BOSidebar } from '@/components/BOSidebar';

export default function Loading() {
  return (
    <AdminPage sidebar={<BOSidebar active="/articles" />} title="아티클 상세" prefix="bo">
      <DetailPageSkeleton />
    </AdminPage>
  );
}

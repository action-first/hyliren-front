import { AdminPage, ListPageSkeleton } from '@hyliren/ui';
import { POSidebar } from '@/components/POSidebar';
import { t } from '@hyliren/i18n';
import { getServerLocale } from '@/lib/server-locale';

export default async function Loading() {
  const locale = await getServerLocale();
  return (
    <AdminPage sidebar={<POSidebar active="/concerns" />} title={t(locale, 'po.concernDetailTitle')} prefix="po">
      <ListPageSkeleton rows={4} />
    </AdminPage>
  );
}

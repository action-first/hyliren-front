import { redirect } from 'next/navigation';

/** 1차 오픈 범위 외 — /dashboard 로 redirect. 2차 오픈 시 복원. */
export default async function ProposalsRedirect({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  redirect(`/${lang}/dashboard`);
}

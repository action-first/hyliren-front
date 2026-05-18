import { redirect } from 'next/navigation';

/** 1차 오픈 범위 외 — 병원 매칭 미오픈. /dashboard 로 redirect. */
export default async function ConcernServicesRedirect({ params }: { params: Promise<{ lang: string; id: string }> }) {
  const { lang } = await params;
  redirect(`/${lang}/dashboard`);
}

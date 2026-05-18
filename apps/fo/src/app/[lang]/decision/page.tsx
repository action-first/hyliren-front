import { redirect } from 'next/navigation';

/**
 * /decision (제안서 비교) — 1차 오픈 범위 외 (병원 매칭 미오픈).
 *
 * 2차 오픈 시 git history 의 이전 구현 복원:
 *   git log --oneline --all -- apps/fo/src/app/'[lang]'/decision/page.tsx
 *
 * 직접 URL 진입 시 /dashboard 로 redirect.
 */
export default async function DecisionRedirect({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  redirect(`/${lang}/dashboard`);
}

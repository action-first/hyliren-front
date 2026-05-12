import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { isLocale, LOCALES, type Locale } from '@hyliren/shared';
import { env } from '@/lib/env';
import { LegalPageShell } from '../_legal/LegalPageShell';
import { TermsContent } from '@/components/legal/TermsContent';

export const revalidate = 86400;

interface PageProps {
  params: Promise<{ lang: string }>;
}

const META: Record<Locale, { title: string; subtitle: string; back: string; effective: string }> = {
  'ko': {
    title: '이용약관',
    subtitle: '미묘 서비스 이용에 관한 회원과 회사 간의 기본 사항을 정합니다.',
    back: '마이페이지로 돌아가기',
    effective: '시행일: 2026년 5월 11일',
  },
  'zh-CN': {
    title: '服务条款',
    subtitle: '关于美妙服务使用,会员与公司之间的基本事项。',
    back: '返回我的页面',
    effective: '生效日:2026年5月11日',
  },
  'ja': {
    title: '利用規約',
    subtitle: 'ミミョのサービス利用に関する、会員と当社の基本事項を定めます。',
    back: 'マイページに戻る',
    effective: '施行日:2026年5月11日',
  },
  'en': {
    title: 'Terms of Service',
    subtitle: 'Basic terms governing the use of the MIMYO service between members and the Company.',
    back: 'Back to My Page',
    effective: 'Effective: May 11, 2026',
  },
};

function buildAlternates(): Record<string, string> {
  const out: Record<string, string> = {};
  for (const l of LOCALES) out[l] = `${env.siteUrl}/${l}/terms`;
  out['x-default'] = `${env.siteUrl}/zh-CN/terms`;
  return out;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return { robots: { index: false, follow: false } };
  const m = META[lang];
  return {
    metadataBase: new URL(env.siteUrl),
    title: m.title,
    description: m.subtitle,
    alternates: { canonical: `${env.siteUrl}/${lang}/terms`, languages: buildAlternates() },
    openGraph: { title: m.title, description: m.subtitle, type: 'article', locale: lang, siteName: 'MIMYO' },
  };
}

export default async function TermsPage({ params }: PageProps) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const m = META[lang];

  return (
    <LegalPageShell
      title={m.title}
      subtitle={m.subtitle}
      backHref="/mypage"
      backLabel={m.back}
      effectiveDateLabel={m.effective}
    >
      <TermsContent locale={lang} />
    </LegalPageShell>
  );
}

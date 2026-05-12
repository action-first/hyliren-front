import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { isLocale, LOCALES, type Locale } from '@hyliren/shared';
import { env } from '@/lib/env';
import { LegalPageShell } from '../_legal/LegalPageShell';
import { PrivacyContent } from '@/components/legal/PrivacyContent';

/**
 * 개인정보처리방침 — 한국 개인정보보호법 제30조 법정 필수.
 *
 * 본문은 `@/components/legal/PrivacyContent` 에서 4 lang × Section 정의. page
 * 는 LegalPageShell (title/back/effective) 만 책임. AuthModal (BottomSheet step)
 * 에서 동일 PrivacyContent 재사용.
 */

export const revalidate = 86400; // 24h

interface PageProps {
  params: Promise<{ lang: string }>;
}

const META: Record<Locale, { title: string; subtitle: string; back: string; effective: string }> = {
  'ko': {
    title: '개인정보처리방침',
    subtitle: '미묘 서비스를 이용하시는 회원님의 개인정보 보호를 위한 처리 방침을 안내드립니다.',
    back: '마이페이지로 돌아가기',
    effective: '시행일: 2026년 5월 11일',
  },
  'zh-CN': {
    title: '隐私政策',
    subtitle: '关于使用美妙服务时,会员个人信息保护的处理方针。',
    back: '返回我的页面',
    effective: '生效日:2026年5月11日',
  },
  'ja': {
    title: 'プライバシーポリシー',
    subtitle: 'ミミョのサービスをご利用の会員様の個人情報保護に関する処理方針のご案内です。',
    back: 'マイページに戻る',
    effective: '施行日:2026年5月11日',
  },
  'en': {
    title: 'Privacy Policy',
    subtitle: 'Our policy for handling and protecting the personal information of users of the MIMYO service.',
    back: 'Back to My Page',
    effective: 'Effective: May 11, 2026',
  },
};

function buildAlternates(): Record<string, string> {
  const out: Record<string, string> = {};
  for (const l of LOCALES) out[l] = `${env.siteUrl}/${l}/privacy`;
  out['x-default'] = `${env.siteUrl}/zh-CN/privacy`;
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
    alternates: { canonical: `${env.siteUrl}/${lang}/privacy`, languages: buildAlternates() },
    openGraph: { title: m.title, description: m.subtitle, type: 'article', locale: lang, siteName: 'MIMYO' },
  };
}

export default async function PrivacyPage({ params }: PageProps) {
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
      <PrivacyContent locale={lang} />
    </LegalPageShell>
  );
}

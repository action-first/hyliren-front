import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { isLocale, LOCALES, type Locale } from '@hyliren/shared';
import { env } from '@/lib/env';
import { LegalPageShell } from '../_legal/LegalPageShell';

/**
 * 의료 안내 면책 조항 — 한국 의료광고법 헷지 및 콘텐츠 면책.
 *
 * 핵심: 미묘는 의료기관이 아니며, 콘텐츠는 일반 정보 안내 — 의학적 진단·처방 대체 X.
 */

export const revalidate = 86400;

interface PageProps {
  params: Promise<{ lang: string }>;
}

const META: Record<Locale, { title: string; subtitle: string; back: string; effective: string }> = {
  'ko': {
    title: '의료 안내 면책 조항',
    subtitle: '미묘에서 제공하는 시술 정보·아티클·매칭 콘텐츠의 한계와 주의 사항을 안내드립니다.',
    back: '마이페이지로 돌아가기',
    effective: '시행일: 2026년 5월 11일',
  },
  'zh-CN': {
    title: '医疗信息免责声明',
    subtitle: '关于美妙提供的项目信息、文章、匹配内容的限制和注意事项的说明。',
    back: '返回我的页面',
    effective: '生效日:2026年5月11日',
  },
  'ja': {
    title: '医療情報の免責事項',
    subtitle: 'ミミョが提供する施術情報・記事・マッチングコンテンツの限界と注意事項のご案内です。',
    back: 'マイページに戻る',
    effective: '施行日:2026年5月11日',
  },
  'en': {
    title: 'Medical Information Disclaimer',
    subtitle: 'Notice on the limitations and precautions regarding procedure information, articles, and matching content provided by MIMYO.',
    back: 'Back to My Page',
    effective: 'Effective: May 11, 2026',
  },
};

function buildAlternates(): Record<string, string> {
  const out: Record<string, string> = {};
  for (const l of LOCALES) out[l] = `${env.siteUrl}/${l}/medical-disclaimer`;
  out['x-default'] = `${env.siteUrl}/zh-CN/medical-disclaimer`;
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
    alternates: { canonical: `${env.siteUrl}/${lang}/medical-disclaimer`, languages: buildAlternates() },
    openGraph: { title: m.title, description: m.subtitle, type: 'article', locale: lang, siteName: 'MIMYO' },
  };
}

function Section({ heading, children }: { heading: string; children: React.ReactNode }) {
  return (
    <section className="mb-6">
      <h2 className="text-[15px] font-bold text-[var(--color-text)] mt-6 mb-2">{heading}</h2>
      <div className="text-[13.5px] leading-[1.75]">{children}</div>
    </section>
  );
}

function BodyKo() {
  return (
    <>
      <Section heading="1. 미묘의 역할">
        미묘는 한국 의료관광 시술 매칭 플랫폼입니다. 미묘는 의료기관이 아니며, 의료 행위(진단·처방·시술)를 직접 제공하지 않습니다. 실제 진료·시술은 매칭된 한국의 의료기관이 수행합니다.
      </Section>
      <Section heading="2. 콘텐츠의 성격">
        미묘가 제공하는 아티클·시술 안내·매칭 제안서 내 정보는 **일반적인 시술 정보 안내** 입니다. 의학적 진단·처방·치료 권고를 대체하지 않습니다. 개인의 건강 상태, 알레르기, 복용 약물, 기저질환 등에 따라 적용 가능 여부와 결과가 달라질 수 있습니다.
      </Section>
      <Section heading="3. 매칭 결과에 대한 책임 한계">
        매칭된 의료기관의 정보(자격·가격·시술 옵션)는 의료기관이 직접 제공한 자료를 기반으로 합니다. 미묘는 정확성 확보를 위해 노력하나, 시술의 결과·부작용·예후를 보장하지 않습니다. 모든 시술 결정은 충분한 의료진 상담 후 본인의 책임으로 진행되어야 합니다.
      </Section>
      <Section heading="4. 응급 상황">
        본 서비스의 콘텐츠는 응급 의료 상황의 진단·치료 가이드로 사용될 수 없습니다. 응급 상황 발생 시 즉시 가까운 의료기관에 직접 방문하시거나 응급 의료 전화(한국 119)에 연락하시기 바랍니다.
      </Section>
      <Section heading="5. 의료광고 안내">
        본 서비스에 게시된 의료 광고 및 시술 정보는 한국 의료법 및 의료광고 사전심의 기준에 따라 운영합니다. 특정 시술의 효과·안전성을 단정짓는 표현이 포함된 경우 일반적인 가이드 차원의 정보이며, 실제 적용은 의료진 상담 후 결정됩니다.
      </Section>
      <Section heading="6. 임신·수유 등 특수 상태">
        임신·수유·자가면역 질환·켈로이드 체질 등 특수 상태인 경우 일부 시술이 제한될 수 있으며, 매칭 단계에서 반드시 의료진에게 사전 고지가 필요합니다.
      </Section>
    </>
  );
}

function BodyZhCN() {
  return (
    <>
      <Section heading="1. 美妙的角色">
        美妙是韩国医疗旅游项目匹配平台。美妙不是医疗机构,不直接提供医疗行为(诊断、处方、施术)。实际诊疗、施术由匹配的韩国医疗机构进行。
      </Section>
      <Section heading="2. 内容性质">
        美妙提供的文章、项目说明、匹配方案书内的信息为**一般性项目信息介绍**。不替代医学诊断、处方、治疗建议。根据个人健康状况、过敏史、用药、基础疾病等,适用与否及结果可能不同。
      </Section>
      <Section heading="3. 匹配结果的责任限制">
        匹配的医疗机构信息(资质、价格、项目方案)基于医疗机构直接提供的资料。美妙努力确保准确性,但不保证项目结果、副作用、预后。所有项目决策应在充分的医生面诊后,由本人自行决定。
      </Section>
      <Section heading="4. 紧急情况">
        本服务的内容不可用于紧急医疗情况的诊断、治疗指引。发生紧急情况时,请立即就近就医,或拨打紧急医疗电话(韩国 119)。
      </Section>
      <Section heading="5. 医疗广告说明">
        本服务发布的医疗广告及项目信息依据韩国医疗法及医疗广告事前审查标准运营。如包含断言特定项目效果、安全性的表述,均为一般性指南信息,实际适用由医生面诊后决定。
      </Section>
      <Section heading="6. 妊娠、哺乳等特殊状态">
        妊娠、哺乳、自身免疫疾病、瘢痕体质等特殊状态,部分项目可能受限,匹配阶段务必事先告知医生。
      </Section>
    </>
  );
}

function BodyJa() {
  return (
    <>
      <Section heading="1. ミミョの役割">
        ミミョは韓国医療観光の施術マッチングプラットフォームです。ミミョは医療機関ではなく、医療行為(診断・処方・施術)を直接提供しません。実際の診療・施術はマッチングされた韓国の医療機関が行います。
      </Section>
      <Section heading="2. コンテンツの性質">
        ミミョが提供する記事・施術案内・マッチング提案書内の情報は、**一般的な施術情報の案内** です。医学的な診断・処方・治療勧告に代わるものではありません。個人の健康状態、アレルギー、服用中の薬、既往症などにより、適用可否と結果は異なる場合があります。
      </Section>
      <Section heading="3. マッチング結果の責任限度">
        マッチングされた医療機関の情報(資格・価格・施術オプション)は、医療機関が直接提供した資料に基づきます。ミミョは正確性確保のために努めますが、施術の結果・副作用・予後を保証しません。すべての施術の決定は、医療従事者との十分な相談ののち、ご本人の責任でお進めください。
      </Section>
      <Section heading="4. 緊急時">
        本サービスのコンテンツは、緊急医療状況の診断・治療ガイドとして使用できません。緊急時は直ちに最寄りの医療機関を受診するか、緊急医療電話(韓国 119)へご連絡ください。
      </Section>
      <Section heading="5. 医療広告について">
        本サービスに掲載される医療広告および施術情報は、韓国医療法および医療広告事前審査基準に従って運営されます。特定施術の効果・安全性を断定する表現が含まれる場合、それらは一般的なガイド情報であり、実際の適用は医療従事者との相談ののち決定されます。
      </Section>
      <Section heading="6. 妊娠・授乳など特殊な状態">
        妊娠、授乳、自己免疫疾患、ケロイド体質などの特殊な状態では一部の施術が制限される場合があり、マッチング段階で必ず事前に医療従事者に告知が必要です。
      </Section>
    </>
  );
}

function BodyEn() {
  return (
    <>
      <Section heading="1. The role of MIMYO">
        MIMYO is a Korean medical-tourism procedure matching platform. MIMYO is not a medical institution and does not directly provide medical services (diagnosis, prescription, procedures). Actual consultations and procedures are performed by the matched Korean medical institutions.
      </Section>
      <Section heading="2. Nature of the content">
        Information in MIMYO's articles, procedure guides, and matching proposals is **general procedure information**. It does not replace medical diagnosis, prescription, or treatment recommendations. Applicability and outcomes may vary depending on individual health status, allergies, current medications, and underlying conditions.
      </Section>
      <Section heading="3. Limitation regarding matching results">
        Information on matched medical institutions (credentials, prices, procedure options) is based on materials provided directly by the institutions. MIMYO makes good-faith efforts to ensure accuracy but does not guarantee outcomes, side effects, or prognosis. All decisions to undergo a procedure should be made by the member, after sufficient consultation with the medical practitioner.
      </Section>
      <Section heading="4. Emergencies">
        Content from this Service may not be used as a guide for the diagnosis or treatment of medical emergencies. In an emergency, please immediately visit the nearest medical institution or call the emergency medical line (119 in Korea).
      </Section>
      <Section heading="5. Medical advertising">
        Medical advertising and procedure information published on this Service is operated in accordance with the Medical Act of the Republic of Korea and the pre-review standards for medical advertising. Any expressions that may seem to assert the effectiveness or safety of a specific procedure are intended as general guidance; actual applicability is determined after consultation with the medical practitioner.
      </Section>
      <Section heading="6. Special conditions (pregnancy, breastfeeding, etc.)">
        Some procedures may be restricted for those who are pregnant, breastfeeding, have autoimmune conditions, or are keloid-prone. Such conditions must be disclosed to the medical practitioner before matching.
      </Section>
    </>
  );
}

const BODIES: Record<Locale, () => React.ReactNode> = {
  'ko': BodyKo,
  'zh-CN': BodyZhCN,
  'ja': BodyJa,
  'en': BodyEn,
};

export default async function MedicalDisclaimerPage({ params }: PageProps) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const m = META[lang];
  const Body = BODIES[lang];

  return (
    <LegalPageShell
      title={m.title}
      subtitle={m.subtitle}
      backHref="/mypage"
      backLabel={m.back}
      effectiveDateLabel={m.effective}
    >
      <Body />
    </LegalPageShell>
  );
}

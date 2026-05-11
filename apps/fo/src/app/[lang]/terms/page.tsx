import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { isLocale, LOCALES, type Locale } from '@hyliren/shared';
import { env } from '@/lib/env';
import { LegalPageShell } from '../_legal/LegalPageShell';

/**
 * 이용약관 — 회원과 회사(미묘) 간 서비스 이용 계약의 기본 사항.
 *
 * 본 페이지는 오픈 직전 v1 초안이며, 정식 법무 자문 후 보강 예정.
 * 핵심: 서비스 정의(매칭 플랫폼, 의료 행위 X) / 책임 한계 / 분쟁 해결 / 준거법.
 */

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
      <Section heading="제1조 (목적)">
        본 약관은 미묘(이하 “회사”)가 제공하는 한국 의료관광 시술 매칭 서비스(이하 “서비스”) 이용에 관한 회원과 회사 간의 권리·의무·책임 사항을 규정함을 목적으로 합니다.
      </Section>
      <Section heading="제2조 (서비스의 정의 및 범위)">
        - 회사는 회원의 시술 고민을 입력받아 검증된 한국 의료기관과 매칭하고, 의료기관이 발송한 제안서를 회원에게 전달하는 플랫폼을 제공합니다.{'\n'}
        - 회사는 의료 행위(진단·처방·시술)를 직접 제공하지 않으며, 매칭된 의료기관과 회원 간의 실제 의료 계약은 양자 간 직접 체결됩니다.{'\n'}
        - 회사는 의료기관의 정보 정확성을 위해 노력하나, 의료 결과를 보장하지 않습니다.
      </Section>
      <Section heading="제3조 (회원가입 및 약관 동의)">
        회원은 회원가입 시 본 약관과 개인정보처리방침에 동의한 것으로 봅니다. 만 14세 미만은 회원가입이 제한됩니다.
      </Section>
      <Section heading="제4조 (회원의 의무)">
        - 정확한 정보 제공: 시술 고민·신체 정보·체류 일정 등은 의료기관 매칭의 기초가 되므로 정확히 입력합니다.{'\n'}
        - 타인 정보 도용 금지, 사진 등 콘텐츠의 저작권 침해 금지.{'\n'}
        - 서비스 무단 복제·자동화 도구(크롤러 등) 금지.
      </Section>
      <Section heading="제5조 (서비스 변경·중단)">
        회사는 운영상·기술상 필요한 경우 서비스 내용을 변경할 수 있으며, 변경 시 사전 고지합니다. 천재지변·기술 장애 등 불가항력 사유로 서비스 제공이 일시 중단될 수 있습니다.
      </Section>
      <Section heading="제6조 (책임 한계)">
        - 회사는 매칭 플랫폼 제공자로서, 의료기관의 진료·시술 결과에 대해 책임지지 않습니다.{'\n'}
        - 매칭된 의료기관의 정보 정확성, 가격 변동, 시술 결과에 관한 분쟁은 회원과 의료기관 간 직접 해결을 원칙으로 합니다.{'\n'}
        - 회사의 고의·중과실이 없는 한, 회원의 손해에 대해 회사는 배상 책임을 지지 않습니다.
      </Section>
      <Section heading="제7조 (지적재산권)">
        서비스 내 콘텐츠(아티클, 디자인, 코드 등)의 저작권은 회사에 귀속됩니다. 회원이 등록한 사진·텍스트의 저작권은 회원에게 있으며, 회원은 회사가 서비스 운영 목적으로 해당 콘텐츠를 사용·복제·전송하는 것에 동의합니다.
      </Section>
      <Section heading="제8조 (분쟁 해결 및 준거법)">
        본 약관은 대한민국 법령에 따라 해석되며, 회원과 회사 간 분쟁은 대한민국 서울중앙지방법원을 1심 관할 법원으로 합니다.
      </Section>
      <Section heading="제9조 (약관의 변경)">
        본 약관이 변경될 경우 시행일 7일 전(회원에게 불리한 변경은 30일 전) 본 페이지를 통해 공지합니다. 회원이 변경된 약관에 동의하지 않을 경우 탈퇴할 수 있습니다.
      </Section>
    </>
  );
}

function BodyZhCN() {
  return (
    <>
      <Section heading="第1条(目的)">
        本条款规定关于美妙(以下简称“公司”)所提供的韩国医疗旅游项目匹配服务(以下简称“服务”)的使用,会员与公司之间的权利、义务、责任事项。
      </Section>
      <Section heading="第2条(服务定义及范围)">
        - 公司接收会员的项目咨询,与经过认证的韩国医疗机构进行匹配,并将医疗机构发送的方案书传达给会员。{'\n'}
        - 公司不直接提供医疗行为(诊断、处方、施术),匹配后的实际医疗合同由会员与医疗机构直接签订。{'\n'}
        - 公司为医疗机构信息准确性而努力,但不保证医疗结果。
      </Section>
      <Section heading="第3条(注册及条款同意)">
        会员注册时视为已同意本条款及隐私政策。未满 14 岁不可注册。
      </Section>
      <Section heading="第4条(会员义务)">
        - 提供准确信息:项目咨询、身体信息、停留日程等是医疗机构匹配的依据,需准确输入。{'\n'}
        - 禁止盗用他人信息,禁止侵害照片等内容的著作权。{'\n'}
        - 禁止未经授权复制服务、使用自动化工具(爬虫等)。
      </Section>
      <Section heading="第5条(服务变更、中断)">
        公司因运营、技术需要可变更服务内容,变更时事先公告。因不可抗力(自然灾害、技术故障等)可能临时中断服务。
      </Section>
      <Section heading="第6条(责任限制)">
        - 公司作为匹配平台提供者,不对医疗机构的诊疗、施术结果承担责任。{'\n'}
        - 匹配的医疗机构信息准确性、价格变动、施术结果相关争议,以会员与医疗机构直接解决为原则。{'\n'}
        - 除非公司存在故意或重大过失,公司不对会员的损害承担赔偿责任。
      </Section>
      <Section heading="第7条(知识产权)">
        服务内的内容(文章、设计、代码等)著作权归公司所有。会员上传的照片、文本的著作权归会员,会员同意公司为服务运营目的使用、复制、传输相关内容。
      </Section>
      <Section heading="第8条(争议解决及准据法)">
        本条款依据大韩民国法律解释,会员与公司之间的争议以大韩民国首尔中央地方法院为一审管辖法院。
      </Section>
      <Section heading="第9条(条款变更)">
        本条款变更时,在生效日 7 天前(对会员不利的变更为 30 天前)通过本页面公告。会员如不同意变更后的条款,可办理退出。
      </Section>
    </>
  );
}

function BodyJa() {
  return (
    <>
      <Section heading="第1条(目的)">
        本規約は、ミミョ(以下「当社」)が提供する韓国医療観光の施術マッチングサービス(以下「サービス」)の利用に関する、会員と当社の権利・義務・責任事項を定めることを目的とします。
      </Section>
      <Section heading="第2条(サービスの定義および範囲)">
        - 当社は会員の施術の悩みを受け、認証済みの韓国の医療機関とマッチングし、医療機関が送付した提案書を会員に伝達するプラットフォームを提供します。{'\n'}
        - 当社は医療行為(診断・処方・施術)を直接提供せず、マッチング後の実際の医療契約は会員と医療機関の間で直接締結されます。{'\n'}
        - 当社は医療機関情報の正確性に努めますが、医療結果を保証しません。
      </Section>
      <Section heading="第3条(会員登録および規約同意)">
        会員は会員登録時に本規約および個人情報保護方針に同意したものとみなします。14 歳未満は会員登録できません。
      </Section>
      <Section heading="第4条(会員の義務)">
        - 正確な情報の提供:施術の悩み・身体情報・滞在日程などはマッチングの基礎となるため、正確に入力します。{'\n'}
        - 他人情報の盗用禁止、写真など著作権侵害の禁止。{'\n'}
        - サービスの無断複製、自動化ツール(クローラなど)の使用禁止。
      </Section>
      <Section heading="第5条(サービスの変更・中断)">
        当社は運営上・技術上必要な場合、サービス内容を変更でき、変更時には事前告知します。天災・技術障害など不可抗力によりサービス提供が一時中断する場合があります。
      </Section>
      <Section heading="第6条(責任の限度)">
        - 当社はマッチングプラットフォーム提供者として、医療機関の診療・施術結果に対して責任を負いません。{'\n'}
        - マッチング先の情報正確性、価格変動、施術結果に関する紛争は、会員と医療機関の間で直接解決することを原則とします。{'\n'}
        - 当社の故意・重過失がない限り、会員の損害について当社は賠償責任を負いません。
      </Section>
      <Section heading="第7条(知的財産権)">
        サービス内のコンテンツ(記事、デザイン、コードなど)の著作権は当社に帰属します。会員が登録した写真・テキストの著作権は会員に帰属し、会員は当社がサービス運営目的で当該コンテンツを使用・複製・送信することに同意します。
      </Section>
      <Section heading="第8条(紛争解決および準拠法)">
        本規約は大韓民国の法令に従って解釈され、会員と当社の紛争は大韓民国ソウル中央地方裁判所を第一審の管轄裁判所とします。
      </Section>
      <Section heading="第9条(規約の変更)">
        本規約が変更される場合、施行日の 7 日前(会員に不利な変更は 30 日前)に本ページにて告知します。変更後の規約に同意しない会員は退会できます。
      </Section>
    </>
  );
}

function BodyEn() {
  return (
    <>
      <Section heading="Article 1 (Purpose)">
        These Terms set out the rights, obligations, and responsibilities between members and MIMYO (the "Company") regarding the use of the Korean medical-tourism procedure matching service (the "Service").
      </Section>
      <Section heading="Article 2 (Service definition and scope)">
        - The Company operates a platform that receives members' procedure concerns, matches them with verified Korean medical institutions, and forwards the proposals from those institutions to the member.{'\n'}
        - The Company does not directly provide medical services (diagnosis, prescription, procedure). The actual medical contract is concluded directly between the member and the medical institution.{'\n'}
        - The Company makes good-faith efforts to ensure the accuracy of medical-institution information but does not guarantee medical outcomes.
      </Section>
      <Section heading="Article 3 (Registration and acceptance)">
        Upon registration, the member is deemed to have accepted these Terms and the Privacy Policy. Registration is restricted for users under 14 years of age.
      </Section>
      <Section heading="Article 4 (Member obligations)">
        - Provide accurate information: procedure concerns, physical information, and stay schedule serve as the basis for matching and must be entered accurately.{'\n'}
        - No identity theft; no infringement of copyright in photos or other content.{'\n'}
        - No unauthorized reproduction of the Service; no automated tools (crawlers, etc.).
      </Section>
      <Section heading="Article 5 (Service changes and suspension)">
        The Company may modify Service content for operational or technical reasons, with prior notice. Service may be temporarily suspended due to force majeure (natural disaster, technical failure, etc.).
      </Section>
      <Section heading="Article 6 (Limitation of liability)">
        - As a matching platform operator, the Company is not responsible for the diagnosis or procedure outcomes of medical institutions.{'\n'}
        - Disputes regarding the accuracy of matched institution information, price changes, or procedure outcomes are to be resolved directly between the member and the medical institution.{'\n'}
        - Except in cases of the Company's intentional misconduct or gross negligence, the Company shall not be liable for any damages suffered by the member.
      </Section>
      <Section heading="Article 7 (Intellectual property)">
        Copyright in the Service's content (articles, design, code, etc.) belongs to the Company. Copyright in photos and text submitted by the member belongs to the member, who agrees that the Company may use, reproduce, and transmit such content for Service-operation purposes.
      </Section>
      <Section heading="Article 8 (Dispute resolution and governing law)">
        These Terms are interpreted under the laws of the Republic of Korea, and disputes between the member and the Company are subject to the first-instance jurisdiction of the Seoul Central District Court of the Republic of Korea.
      </Section>
      <Section heading="Article 9 (Amendments)">
        Any amendments will be announced on this page 7 days before the effective date (30 days for amendments disadvantageous to members). Members who do not consent to the amended Terms may withdraw from the Service.
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

export default async function TermsPage({ params }: PageProps) {
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

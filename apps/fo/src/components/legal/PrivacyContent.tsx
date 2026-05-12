'use client';

import type { Locale } from '@hyliren/shared';

/**
 * Privacy 본문 — page (server SSR) 와 AuthModal (BottomSheet step) 양쪽에서 재사용.
 *
 * Wrapper 없이 Section 만 출력. caller 가 자기 layout 안에 삽입.
 */

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
      <Section heading="1. 개인정보의 수집 항목 및 방법">
        미묘(이하 “회사”)는 서비스 제공을 위해 다음 항목을 수집합니다.{'\n'}
        - 필수: 이메일, 비밀번호(암호화 저장), 언어 설정{'\n'}
        - 매칭 시: 회원이 등록한 시술 고민 텍스트, 첨부 사진, 신체 부위·예산·체류 일정 정보{'\n'}
        - 자동 수집: 접속 IP, 디바이스 정보, 쿠키({`mimyo-locale`}){'\n'}
        수집 방법: 회원가입·서비스 이용 과정에서 회원이 직접 입력 또는 자동 생성.
      </Section>
      <Section heading="2. 개인정보의 이용 목적">
        - 회원 식별·로그인·세션 유지{'\n'}
        - 시술 고민에 맞는 한국 병원 매칭 및 제안서 전달{'\n'}
        - 서비스 개선 통계·고객 문의 응대{'\n'}
        - 법령상 의무 이행 (전자상거래법, 통신비밀보호법 등)
      </Section>
      <Section heading="3. 보유 및 이용 기간">
        - 회원정보: 회원 탈퇴 시까지 (탈퇴 시 즉시 파기){'\n'}
        - 매칭 고민·사진: 매칭 완료 후 6개월 (분쟁 대응 목적) 후 파기{'\n'}
        - 결제·거래 기록: 전자상거래법에 따라 5년 보관{'\n'}
        - 접속 기록: 통신비밀보호법에 따라 3개월 보관
      </Section>
      <Section heading="4. 제3자 제공">
        회사는 회원의 동의 없이 개인정보를 제3자에게 제공하지 않습니다. 단, 회원이 매칭 요청 시 다음 정보가 매칭 대상 한국 의료기관에 제공됩니다.{'\n'}
        - 제공 항목: 고민 텍스트, 사진, 신체 부위, 예산, 체류 일정 (이메일·연락처 제외){'\n'}
        - 제공 목적: 회원 고민에 맞는 제안서 작성{'\n'}
        - 보유 기간: 매칭 종료 후 6개월
      </Section>
      <Section heading="5. 처리 위탁">
        회사는 서비스 운영을 위해 다음 업체에 일부 처리를 위탁합니다.{'\n'}
        - 인프라: Vercel Inc. (호스팅), Railway Inc. (서버), Cloudflare R2 (이미지 저장){'\n'}
        - LLM 분석: Anthropic Inc. (고민 텍스트 자동 정리 — 익명화 후 전달){'\n'}
        수탁업체는 위탁 목적 외 이용을 금지하며, 안전한 처리를 위한 계약을 체결합니다.
      </Section>
      <Section heading="6. 정보주체의 권리">
        회원은 언제든 개인정보 열람·정정·삭제·처리 정지를 요청할 수 있습니다. 요청은 마이페이지 또는 아래 연락처를 통해 접수 가능합니다.
      </Section>
      <Section heading="7. 쿠키 사용">
        회사는 언어 설정 유지를 위해 {`mimyo-locale`} 쿠키(1년)를 사용합니다. 사용자는 브라우저 설정에서 쿠키 저장을 거부할 수 있으나, 이 경우 일부 서비스 이용이 제한될 수 있습니다.
      </Section>
      <Section heading="8. 개인정보 보호책임자">
        - 책임자: 최성환{'\n'}
        - 연락처: csh4332@gmail.com{'\n'}
        문의 시 즉시 답변 드립니다.
      </Section>
      <Section heading="9. 변경 이력">
        본 방침이 변경될 경우 시행일 7일 전 본 페이지를 통해 공지합니다.
      </Section>
    </>
  );
}

function BodyZhCN() {
  return (
    <>
      <Section heading="1. 收集的个人信息项目和方式">
        美妙(以下简称“公司”)为提供服务,收集以下信息。{'\n'}
        - 必需:邮箱、密码(加密保存)、语言设置{'\n'}
        - 匹配时:会员登记的项目咨询文本、附加照片、身体部位、预算、停留日程{'\n'}
        - 自动收集:访问 IP、设备信息、Cookie({`mimyo-locale`}){'\n'}
        收集方式:在注册、使用服务过程中由会员直接输入或自动生成。
      </Section>
      <Section heading="2. 个人信息使用目的">
        - 会员识别、登录、会话维护{'\n'}
        - 根据会员咨询匹配韩国医院并转发方案书{'\n'}
        - 服务改进统计、客户咨询响应{'\n'}
        - 法律义务履行(电子商务法、通信秘密保护法等)
      </Section>
      <Section heading="3. 保留及使用期间">
        - 会员信息:至会员退出时(退出时立即销毁){'\n'}
        - 匹配咨询、照片:匹配完成后 6 个月(用于纠纷应对)后销毁{'\n'}
        - 结算、交易记录:依据电子商务法保管 5 年{'\n'}
        - 访问记录:依据通信秘密保护法保管 3 个月
      </Section>
      <Section heading="4. 第三方提供">
        未经会员同意,公司不会将个人信息提供给第三方。但会员发起匹配申请时,以下信息会提供给匹配对象的韩国医疗机构。{'\n'}
        - 提供项目:咨询文本、照片、身体部位、预算、停留日程(不含邮箱·联系方式){'\n'}
        - 提供目的:为会员咨询撰写匹配方案{'\n'}
        - 保留期间:匹配结束后 6 个月
      </Section>
      <Section heading="5. 处理委托">
        公司为运营服务,将部分处理委托给以下机构。{'\n'}
        - 基础设施:Vercel Inc.(托管)、Railway Inc.(服务器)、Cloudflare R2(图片存储){'\n'}
        - LLM 分析:Anthropic Inc.(咨询文本自动整理 — 匿名化后传输){'\n'}
        受托方禁止超出委托目的使用,并签订安全处理合同。
      </Section>
      <Section heading="6. 信息主体的权利">
        会员可随时申请个人信息的查阅、更正、删除、处理停止。可通过我的页面或下方联系方式提交申请。
      </Section>
      <Section heading="7. Cookie 使用">
        公司使用 {`mimyo-locale`} Cookie(1 年)维持语言设置。用户可在浏览器设置中拒绝 Cookie,但部分服务可能因此受限。
      </Section>
      <Section heading="8. 个人信息保护负责人">
        - 负责人:Choi Sung-hwan{'\n'}
        - 联系方式:csh4332@gmail.com{'\n'}
        提问时将即时回复。
      </Section>
      <Section heading="9. 变更记录">
        本方针变更时,将在生效日 7 天前通过本页面公告。
      </Section>
    </>
  );
}

function BodyJa() {
  return (
    <>
      <Section heading="1. 個人情報の収集項目および方法">
        ミミョ(以下「当社」)はサービス提供のため、以下の項目を収集します。{'\n'}
        - 必須:メールアドレス、パスワード(暗号化保存)、言語設定{'\n'}
        - マッチング時:会員が登録した施術の悩みテキスト、添付写真、身体部位・予算・滞在日程{'\n'}
        - 自動収集:アクセス IP、デバイス情報、Cookie({`mimyo-locale`}){'\n'}
        収集方法:会員登録・サービス利用の過程で会員が直接入力、または自動生成。
      </Section>
      <Section heading="2. 個人情報の利用目的">
        - 会員の識別・ログイン・セッション維持{'\n'}
        - 施術の悩みに合う韓国の病院をマッチングし、提案書を伝達{'\n'}
        - サービス改善の統計・お客様問い合わせ対応{'\n'}
        - 法令上の義務履行(電子商取引法、通信秘密保護法など)
      </Section>
      <Section heading="3. 保有および利用期間">
        - 会員情報:会員退会時まで(退会時に即時破棄){'\n'}
        - マッチング相談・写真:マッチング完了後 6 ヶ月(紛争対応目的)後に破棄{'\n'}
        - 決済・取引記録:電子商取引法により 5 年保管{'\n'}
        - アクセス記録:通信秘密保護法により 3 ヶ月保管
      </Section>
      <Section heading="4. 第三者提供">
        当社は会員の同意なく個人情報を第三者に提供しません。ただし、会員がマッチングを依頼した場合、以下の情報がマッチング対象の韓国医療機関に提供されます。{'\n'}
        - 提供項目:相談テキスト、写真、身体部位、予算、滞在日程(メール・連絡先を除く){'\n'}
        - 提供目的:会員の悩みに合う提案書作成{'\n'}
        - 保有期間:マッチング終了後 6 ヶ月
      </Section>
      <Section heading="5. 処理の委託">
        当社はサービス運営のため、以下の業者に一部の処理を委託します。{'\n'}
        - インフラ:Vercel Inc.(ホスティング)、Railway Inc.(サーバ)、Cloudflare R2(画像保存){'\n'}
        - LLM 分析:Anthropic Inc.(相談テキストの自動整理 — 匿名化後に転送){'\n'}
        受託業者は委託目的外の利用を禁止し、安全な処理のための契約を締結します。
      </Section>
      <Section heading="6. 情報主体の権利">
        会員はいつでも個人情報の閲覧・訂正・削除・処理停止を要求できます。要求はマイページまたは下記連絡先からお受けします。
      </Section>
      <Section heading="7. Cookie の使用">
        当社は言語設定の維持のために {`mimyo-locale`} Cookie(1 年)を使用します。ブラウザ設定で Cookie を拒否できますが、一部のサービス利用が制限される場合があります。
      </Section>
      <Section heading="8. 個人情報保護責任者">
        - 責任者:Choi Sung-hwan{'\n'}
        - 連絡先:csh4332@gmail.com{'\n'}
        お問い合わせには速やかに回答します。
      </Section>
      <Section heading="9. 変更履歴">
        本方針が変更される場合、施行日の 7 日前に本ページにて告知します。
      </Section>
    </>
  );
}

function BodyEn() {
  return (
    <>
      <Section heading="1. Personal information we collect">
        MIMYO (the "Company") collects the following information to provide its service.{'\n'}
        - Required: email, password (stored encrypted), language preference{'\n'}
        - When matching: procedure concern text submitted by the member, attached photos, body area, budget, stay schedule{'\n'}
        - Automatically collected: IP address, device information, cookie ({`mimyo-locale`}){'\n'}
        Collection method: directly entered by the member during signup and use, or automatically generated.
      </Section>
      <Section heading="2. Purpose of use">
        - Member identification, login, session maintenance{'\n'}
        - Matching the member's concern with Korean clinics and delivering proposals{'\n'}
        - Service improvement statistics and customer support{'\n'}
        - Compliance with legal obligations (e-commerce act, communications secrecy act, etc.)
      </Section>
      <Section heading="3. Retention and use period">
        - Member information: until the member withdraws (immediately deleted on withdrawal){'\n'}
        - Matching concerns and photos: deleted 6 months after the match is completed (for dispute response){'\n'}
        - Payment and transaction records: retained 5 years per Korean e-commerce act{'\n'}
        - Access logs: retained 3 months per the communications secrecy act
      </Section>
      <Section heading="4. Disclosure to third parties">
        We do not disclose personal information to third parties without the member's consent. However, when the member requests a match, the following information is provided to the matched Korean medical institution.{'\n'}
        - Items disclosed: concern text, photos, body area, budget, stay schedule (excluding email and contact information){'\n'}
        - Purpose: writing a tailored proposal{'\n'}
        - Retention: 6 months after the match is completed
      </Section>
      <Section heading="5. Processing outsourcing">
        We outsource some processing to the following providers to operate the service.{'\n'}
        - Infrastructure: Vercel Inc. (hosting), Railway Inc. (servers), Cloudflare R2 (image storage){'\n'}
        - LLM analysis: Anthropic Inc. (automatic concern-text organization — sent after anonymization){'\n'}
        Vendors are contractually prohibited from using the data beyond the stated purpose and are bound to secure handling.
      </Section>
      <Section heading="6. Member rights">
        Members may request access, correction, deletion, or processing suspension of their personal information at any time. Requests may be submitted via My Page or the contact below.
      </Section>
      <Section heading="7. Cookies">
        We use the {`mimyo-locale`} cookie (1 year) to maintain the language preference. Users may disable cookies in browser settings, but some service features may be limited.
      </Section>
      <Section heading="8. Privacy officer">
        - Officer: Choi Sung-hwan{'\n'}
        - Contact: csh4332@gmail.com{'\n'}
        We respond promptly to inquiries.
      </Section>
      <Section heading="9. Change history">
        Any changes to this policy will be announced on this page 7 days before the effective date.
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

export function PrivacyContent({ locale }: { locale: Locale }) {
  const Body = BODIES[locale];
  return <Body />;
}

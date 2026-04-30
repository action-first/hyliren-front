# 다국어 처리 전략 — 미묘 (MIMYO)

> **상태**: PR #26·#27·#29 (hyliren-api) 머지본 기준 정리 — **7/7 entity i18n 컨벤션 일치**
> **최종 갱신**: 2026-04-28
> **검토자**: jyjung
> **범위**: BE DB 스키마 + 애플리케이션 레이어 패턴 (자동 번역 엔진/큐 인프라 제외)

---

## 1. 서비스 본질 — 4가지 컨텐츠 번역 흐름

미묘 플랫폼은 **한국 병원 ↔ 중국 의료관광 고객** 매칭 서비스. 사용자는 자국어로만 입력/조회하고, 양측이 다른 언어로 작성한 컨텐츠는 번역되어 노출된다.

```
[1] Concern   (FO)  사용자 zh-CN ──→ ko 한국 병원 (PO)
[2] Proposal  (PO)  병원   ko    ──→ zh-CN 사용자 (FO)
[3] Procedure (PO)  병원   ko    ──→ zh-CN 사용자 (FO)
[4] Article   (BO)  운영자 ko    ──→ zh-CN 사용자 (FO)
```

**향후 확장** (동일 패턴으로 흡수):
- 1:1 문의 (게시판 컨셉, 양방향 — 게시글/답글 단위 단방향)
- 리뷰/후기 (사용자 → 공개)
- 시술 효과 보고서 (병원 → 사용자)
- Partner FAQ (병원 → 사용자)

**번역 시점**: 실시간 요건 없음. 모든 흐름 비동기/배치 처리 가능. 미번역 시 `source_locale` fallback + "번역 준비 중" 배지로 처리.

---

## 2. 현재 구현 상태

### 2-1. 적용 완료 — 7개 entity (전체)

| Entity | Translations 테이블 | 부모 변경 | PR | 상태 |
|---|---|---|---|---|
| `concerns` | `concern_translations` | text 컬럼 제거, `source_locale` 추가 | #26 | ✅ |
| `proposals` | `proposal_translations` | text 컬럼 제거, `source_locale` 추가 | #26 | ✅ |
| `proposal_items` | `proposal_item_translations` | text 컬럼 제거, `source_locale` 추가 | #26 | ✅ |
| `procedures` | `procedure_translations` | `i18n` jsonb DROP, `source_locale` 유지 | #26 | ✅ |
| `procedure_variants` | `procedure_variant_translations` | `i18n` jsonb DROP, `source_locale` 추가 | #26 | ✅ |
| `articles` | `article_translations` | text 컬럼 제거, `source_locale` 추가 | #26 | ✅ |
| **`partner_profiles`** | **`partner_profile_translations`** | **`hospital_name(_zh)`, `description(_zh)` 4컬럼 DROP, `source_locale` 추가** | **#29** | ✅ |

### 2-2. 미적용 / 후속 작업

| Entity | 현재 상태 | 처리 방향 |
|---|---|---|
| `members.locale` | 컬럼 없음 | (Optional) 추가 — partner 표시 언어 추적용. UI locale store 로 우회 가능 |

→ §6 후속 작업 항목 참조.

---

## 3. 표준 컨벤션 (실제 구현 기준)

### 3-1. 부모 테이블

번역 가능 텍스트 컬럼은 **모두 자식 (translations) 테이블로 이동**. 부모는 메타데이터만 보유하고 `source_locale` 컬럼만 추가한다.

```sql
ALTER TABLE <entities> ADD COLUMN source_locale VARCHAR(10) NOT NULL DEFAULT 'ko';
```

`source_locale` 의미:
- 작성자가 입력한 **원본 언어**
- 다른 locale 번역 누락 시 fallback 기준
- Concern 처럼 사용자 작성 컨텐츠는 default `'zh-CN'`, 병원 작성은 default `'ko'`

> **계층 구조 entity** (예: `proposal_items` 가 `proposals` 의 자식, `procedure_variants` 가 `procedures` 의 자식) 도 자체 `source_locale` 을 가진다 — 부모와 다른 locale 로 작성될 가능성을 열어둠.

### 3-2. 자식 테이블 (`*_translations`)

```sql
CREATE TABLE <entity>_translations (
  <entity>_id  VARCHAR(28)  NOT NULL REFERENCES <entities>(<entity>_id) ON DELETE CASCADE,
  locale       VARCHAR(10)  NOT NULL,
  -- 도메인 다국어 필드 (entity 별로 다름)
  ...
  created_at   TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ  NOT NULL DEFAULT now(),
  PRIMARY KEY (<entity>_id, locale)
);
CREATE INDEX idx_<entity>_translations_locale ON <entity>_translations(locale);
```

- **Composite PK** `(entity_id, locale)`: entity 당 locale 1개 row 보장 (UPSERT 자연스러움)
- **`ON DELETE CASCADE`**: 부모 hard-delete 시 자동 정리. 부모가 soft-delete (`deleted_at`) 사용하는 경우엔 cascade 영향 없음
- **`source` 메타 컬럼** (`human` / `auto` / `reviewed`): **현재 미적용** — 자동 번역 도입 시 ALTER TABLE 로 추가 (§7 참조)

---

## 4. Entity 별 스키마 (현재 구현)

### 4-1. concern_translations (사용자 zh-CN → 병원 ko)

```sql
CREATE TABLE concern_translations (
  concern_id       VARCHAR(28)  NOT NULL REFERENCES concerns(concern_id) ON DELETE CASCADE,
  locale           VARCHAR(10)  NOT NULL,
  description      TEXT         NOT NULL,
  raw_narrative    TEXT,
  body_area_detail VARCHAR(300),
  created_at       TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ  NOT NULL DEFAULT now(),
  PRIMARY KEY (concern_id, locale)
);
CREATE INDEX idx_concern_translations_locale ON concern_translations(locale);
```

- `description`: 가공된 본문 (필수)
- `raw_narrative`: AI 가공 전 사용자 원문 입력 (해당 locale)
- `body_area_detail`: 부위 세부 서술
- 부모 `concerns.source_locale` default: `'ko'` (※ Customer 앱의 주 사용자가 중국이지만, schema default 는 ko 로 통일 — 실제 입력 시점에 zh-CN 으로 set)

### 4-2. proposal_translations (병원 ko → 사용자 zh-CN)

```sql
CREATE TABLE proposal_translations (
  proposal_id       VARCHAR(28)  NOT NULL REFERENCES proposals(proposal_id) ON DELETE CASCADE,
  locale            VARCHAR(10)  NOT NULL,
  consultation_note TEXT,
  created_at        TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ  NOT NULL DEFAULT now(),
  PRIMARY KEY (proposal_id, locale)
);
CREATE INDEX idx_proposal_translations_locale ON proposal_translations(locale);
```

### 4-3. proposal_item_translations

```sql
CREATE TABLE proposal_item_translations (
  proposal_item_id VARCHAR(28)  NOT NULL REFERENCES proposal_items(proposal_item_id) ON DELETE CASCADE,
  locale           VARCHAR(10)  NOT NULL,
  treatment_name   VARCHAR(200) NOT NULL,
  description      TEXT,
  created_at       TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ  NOT NULL DEFAULT now(),
  PRIMARY KEY (proposal_item_id, locale)
);
CREATE INDEX idx_proposal_item_translations_locale ON proposal_item_translations(locale);
```

### 4-4. procedure_translations (기존 JSONB → 정규화)

```sql
CREATE TABLE procedure_translations (
  procedure_id VARCHAR(28)  NOT NULL REFERENCES procedures(procedure_id) ON DELETE CASCADE,
  locale       VARCHAR(10)  NOT NULL,
  title        VARCHAR(300) NOT NULL,
  description  TEXT,
  precautions  TEXT,
  indications  JSONB        NOT NULL DEFAULT '[]',
  created_at   TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ  NOT NULL DEFAULT now(),
  PRIMARY KEY (procedure_id, locale)
);
CREATE INDEX idx_procedure_translations_locale ON procedure_translations(locale);
```

- `indications`: 적응증 키워드 배열. JSONB 로 저장 (string array). PG `TEXT[]` 대신 JSONB 채택 — TypeORM 직렬화/조회 일관성 우선.
- 기존 `procedures.i18n` jsonb 컬럼은 DROP 됨.

### 4-5. procedure_variant_translations

```sql
CREATE TABLE procedure_variant_translations (
  procedure_variant_id VARCHAR(28)  NOT NULL REFERENCES procedure_variants(procedure_variant_id) ON DELETE CASCADE,
  locale               VARCHAR(10)  NOT NULL,
  name                 VARCHAR(200) NOT NULL,
  description          TEXT,
  created_at           TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at           TIMESTAMPTZ  NOT NULL DEFAULT now(),
  PRIMARY KEY (procedure_variant_id, locale)
);
CREATE INDEX idx_procedure_variant_translations_locale ON procedure_variant_translations(locale);
```

### 4-6. partner_profile_translations (PR #29)

```sql
CREATE TABLE partner_profile_translations (
  member_id      VARCHAR(28)  NOT NULL REFERENCES partner_profiles(member_id) ON DELETE CASCADE,
  locale         VARCHAR(10)  NOT NULL,
  hospital_name  VARCHAR(200) NOT NULL,
  description    TEXT,
  created_at     TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ  NOT NULL DEFAULT now(),
  PRIMARY KEY (member_id, locale)
);
CREATE INDEX idx_partner_profile_translations_locale ON partner_profile_translations(locale);
```

- 부모 `partner_profiles`: `hospital_name`, `hospital_name_zh`, `description`, `description_zh` 4 컬럼 DROP, `source_locale` (default `'ko'`) 추가
- PR #29 에서 `apps/customer/proposal.service.ts` 의 `partnerProfile.description` 직접 참조도 `pickField` 헬퍼로 locale-aware 처리 (relations 에 `member.partnerProfile.translations` 추가)

### 4-7. article_translations

```sql
CREATE TABLE article_translations (
  article_id VARCHAR(28)  NOT NULL REFERENCES articles(article_id) ON DELETE CASCADE,
  locale     VARCHAR(10)  NOT NULL,
  title      VARCHAR(300) NOT NULL,
  body       TEXT         NOT NULL,
  excerpt    VARCHAR(500),
  created_at TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ  NOT NULL DEFAULT now(),
  PRIMARY KEY (article_id, locale)
);
CREATE INDEX idx_article_translations_locale ON article_translations(locale);
```

---

## 5. 애플리케이션 레이어 (구현 완료)

### 5-1. Locale 결정 — `resolveLocale`

`libs/common/src/i18n/resolve-locale.util.ts`:

```typescript
export function resolveLocale(
  localeQuery?: string | null,
  acceptLanguage?: string | null,
  fallback: Locale = Locale.ZH_CN,
): Locale
```

**우선순위**:
1. 명시적 `localeQuery` (Locale enum 값이면 그대로)
2. `Accept-Language` 헤더 첫 항목 prefix 매칭
3. `fallback` (default `zh-CN` — Customer 앱 주 사용자)

> Partner / Admin 앱처럼 한국어 기본이 필요하면 호출처에서 `fallback: Locale.KO` 명시.

### 5-2. Translation 선택 — `resolveTranslation` / `pickField`

`libs/common/src/i18n/resolve-translation.util.ts`:

```typescript
function resolveTranslation<T extends HasLocale>(
  translations: T[] | null | undefined,
  options: { requested: Locale; fallbackChain?: Locale[]; sourceLocale?: Locale },
): T | null

function pickField<T extends HasLocale, K extends keyof T>(
  translations: T[] | null | undefined,
  field: K,
  options: I18nResolveOptions,
): T[K] | null
```

**Fallback 체인**:
1. `requested` 와 정확히 일치
2. `fallbackChain` 의 각 locale (앞에서부터)
3. `sourceLocale` (부모 row 의 source)
4. 위 모두 실패 시 `null` (UI 측에서 "번역 준비 중" 배지 처리)

### 5-3. 사용 예시 (실제 코드)

`apps/partner/src/concern/concern.service.ts`:

```typescript
description: pickField(concern.translations, 'description', {
  requested: Locale.KO,
  fallbackChain: [Locale.EN],
  sourceLocale: concern.sourceLocale as Locale,
}),
```

`apps/partner/src/proposal/proposal.service.ts`:

```typescript
relations: ['items', 'items.translations', 'translations'],
// ...
const note = pickField(p.translations, 'consultationNote', {
  requested: Locale.ZH_CN,
  sourceLocale: p.sourceLocale as Locale,
});
```

### 5-4. Read 패턴 — Eager load + 메모리 fallback

```typescript
const concerns = await this.repo.find({
  where: { status: ConcernStatus.SUBMITTED },
  relations: ['translations', 'photos', 'user'],
});
// translations 배열 통째로 로드 후 pickField 로 선택 — N+1 회피
```

LEFT JOIN 으로 부모 + translations 한 쿼리에 로드, locale 필터링은 메모리 단계에서 수행 (DB 단계 필터링 시 fallback 못 씀).

### 5-5. Write 패턴

`apps/partner/src/proposal/proposal.service.ts` 의 INSERT 패턴:

```typescript
await dataSource.transaction(async (tx) => {
  await tx.insert(ProposalEntity, { ...parent, sourceLocale: 'ko' });
  const translations: ProposalItemTranslationEntity[] = [];
  for (const item of items) {
    translations.push({ proposalItemId, locale: 'ko', treatmentName, ... });
    if (input.treatmentNameZh) {
      translations.push({ proposalItemId, locale: 'zh-CN', treatmentName: input.treatmentNameZh, ... });
    }
  }
  await tx.insert(ProposalItemTranslationEntity, translations);
});
```

미입력 locale 은 INSERT 안 함 → 조회 시 `pickField` 가 fallback chain 으로 처리.

---

## 6. 후속 작업

### 6-1. members.locale (Optional)

`users.locale` 은 이미 존재 (default `zh-CN`). `members.locale` 도 추가하면:
- Partner 가 PO 진입 시 표시할 언어 추적
- Admin 의 본인 시스템 언어 추적
- BE 응답 시 `Accept-Language` 헤더가 없을 때 server-side fallback 으로 활용 가능

```sql
ALTER TABLE members ADD COLUMN locale VARCHAR(10) NOT NULL DEFAULT 'ko';
```

> 우회 가능: FE 의 `useLocaleStore` 가 zustand persist 로 처리 중. BE 는 매 요청 `Accept-Language` 또는 `localeQuery` 로 결정. **Optional**.

### 6-2. inquiries (게시판 기반 1:1 문의 — 향후 도메인)

```sql
CREATE TABLE inquiries (
  inquiry_id     VARCHAR(28) PRIMARY KEY,
  author_type    VARCHAR(20) NOT NULL,    -- 'user' | 'member'
  author_id      VARCHAR(28) NOT NULL,
  source_locale  VARCHAR(10) NOT NULL,
  status         VARCHAR(20) NOT NULL,    -- 'open' | 'answered' | 'closed'
  category       VARCHAR(50),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at     TIMESTAMPTZ
);

CREATE TABLE inquiry_translations (
  inquiry_id  VARCHAR(28) NOT NULL REFERENCES inquiries(inquiry_id) ON DELETE CASCADE,
  locale      VARCHAR(10) NOT NULL,
  subject     VARCHAR(300) NOT NULL,
  body        TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (inquiry_id, locale)
);

CREATE TABLE inquiry_replies (
  inquiry_reply_id  VARCHAR(28) PRIMARY KEY,
  inquiry_id        VARCHAR(28) NOT NULL REFERENCES inquiries(inquiry_id) ON DELETE CASCADE,
  author_type       VARCHAR(20) NOT NULL,
  author_id         VARCHAR(28) NOT NULL,
  source_locale     VARCHAR(10) NOT NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at        TIMESTAMPTZ
);

CREATE TABLE inquiry_reply_translations (
  inquiry_reply_id  VARCHAR(28) NOT NULL REFERENCES inquiry_replies(inquiry_reply_id) ON DELETE CASCADE,
  locale            VARCHAR(10) NOT NULL,
  body              TEXT NOT NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (inquiry_reply_id, locale)
);
```

→ 게시판 컨셉이지만 각 게시글/답글은 작성자 locale = source 인 단방향. concern + proposal 합친 패턴.

---

## 7. 자동 번역 엔진 도입 시 고려사항

현재 설계는 **수동 입력만 가정** (모든 row 가 사실상 `source='human'`). 자동 번역 도입 시 추가될 항목:

| 추가 항목 | 위치 | 비고 |
|---|---|---|
| Queue 인프라 | BullMQ + Redis 또는 PG LISTEN/NOTIFY | 별도 PR/스프린트 |
| `source` 컬럼 | translations 테이블 메타 | `human` / `auto` / `reviewed` |
| `parent_version` / `outdated` 플래그 | 부모 + translations 양쪽 | source 변경 감지 → 재번역 트리거 |
| `translated_at`, `reviewed_at`, `reviewed_by` | translations 메타 | 검수 워크플로우 audit log |
| 자동 번역 worker | 별도 service | DeepL / GPT 등 vendor 선정 |
| Translation API endpoint | BE | "번역 다시" / "검수 완료" 트리거 |
| BO 번역 검수 도구 | Admin app | 누락/품질 대시보드 |

**현 단계 스키마는 위 확장과 호환** — `source` 등 메타 컬럼은 ALTER TABLE 로 점진 추가 가능.

---

## 8. UI 라벨 i18n (별도 트랙)

`packages/i18n/messages/{ko,zh-CN,ja,en}.json` 키 + `useLocaleStore` 로 관리. 컨텐츠 다국어와 독립적으로 진행.

### 8-1. 앱별 i18n 정책

| 앱 | 다국어 | fallback | 주 사용자 |
|---|---|---|---|
| **FO (Customer)** | 4-locale (ko/zh-CN/ja/en) | `zh-CN` | 중국 의료관광 고객 |
| **PO (Partner)** | 4-locale | `ko` | 한국 병원 |
| **BO (Admin)** | **ko-only** | — | 한국 운영자 |

- BO 는 운영자 전용이라 i18n 인프라 (`useLocaleStore`) 미적용. UI primitive `labels` prop 미주입 시 한국어 fallback 그대로 사용. 향후 ja/en 운영 필요 시 도입.
- BO 에서 표시되는 BE 응답 콘텐츠 (병원 zh-CN 작성 데이터 등) 는 `Accept-Language: ko` 로 ko fallback 받아 표기. 원문 검수 화면이 필요해지면 별도 패턴으로 처리.

### 8-2. Locale 결정 파이프라인

```
[브라우저 nav.language] → 회원가입 입력 → users.locale (DB)
                                              ↓
[로그인 응답 user.locale] → useLocaleStore (FE)
                                              ↓
[useLocaleStore.locale] → Accept-Language 헤더 자동 주입
                                              ↓
[BE resolveLocale] → translations 테이블 picked
```

- locale 변경 시 `PATCH /auth/locale` 호출로 DB 즉시 동기화 → 디바이스 간 일관성
- 로그인 시 `user.locale` → `useLocaleStore.setLocale()` 자동 동기화
- 호환: `narrowLocale(value, fallback)` 정본 헬퍼 (`@hyliren/shared`) 만 사용. 앱별 SUPPORTED_LOCALES 별도 정의 금지.

---

## 9. 참고 (코드 위치)

### 9-1. Entity
- `libs/entities/src/concern.entity.ts` + `concern-translation.entity.ts`
- `libs/entities/src/proposal.entity.ts` + `proposal-translation.entity.ts`
- `libs/entities/src/proposal-item.entity.ts` + `proposal-item-translation.entity.ts`
- `libs/entities/src/procedure.entity.ts` + `procedure-translation.entity.ts`
- `libs/entities/src/procedure-variant.entity.ts` + `procedure-variant-translation.entity.ts`
- `libs/entities/src/article.entity.ts` + `article-translation.entity.ts`
- `libs/entities/src/partner-profile.entity.ts` + `partner-profile-translation.entity.ts`
- `libs/entities/src/enums/index.ts` — `Locale` enum (`ko | zh-CN | ja | en`)

### 9-2. Repository
- `libs/repositories/src/concern-translation.repository.ts`
- `libs/repositories/src/proposal-translation.repository.ts`
- `libs/repositories/src/proposal-item-translation.repository.ts`
- `libs/repositories/src/procedure-translation.repository.ts`
- `libs/repositories/src/procedure-variant-translation.repository.ts`
- `libs/repositories/src/article-translation.repository.ts`
- `libs/repositories/src/partner-profile-translation.repository.ts`

### 9-3. Helper
- `libs/common/src/i18n/resolve-locale.util.ts` — `resolveLocale`
- `libs/common/src/i18n/resolve-translation.util.ts` — `resolveTranslation`, `pickField`
- `libs/common/src/i18n/i18n.types.ts` — `HasLocale`, `I18nResolveOptions`

### 9-4. Service 사용처 (참고)
- `apps/partner/src/concern/concern.service.ts:57` — `pickField(concern.translations, 'description', ...)`
- `apps/partner/src/proposal/proposal.service.ts:151,269` — `relations: ['items', 'items.translations', 'translations']`
- `apps/partner/src/procedure/procedure.service.ts` — `translationsToProcedureI18n` (DB row → I18n map)
- `apps/customer/src/article/article.service.ts` — translations 활용
- `apps/customer/src/concern/concern.service.ts` — 사용자측 read
- `apps/partner/src/profile/profile.service.ts` — translations CRUD + i18n Record 응답
- `apps/customer/src/proposal/proposal.service.ts` — partnerProfile.translations pickField (hospital name/description)

### 9-5. DDL
- `docker/init.sql` — 7개 translations 테이블 정의

### 9-6. PR 이력
- **PR #26** `refact/i18n-table-refactor` — 6 entity 일괄 (concerns/proposals/proposal_items/procedures/procedure_variants/articles) (2026-04-28 머지)
- **PR #27** `fix/partner-procedure-tx-proposal-reload` — 트랜잭션 결함 수정 (2026-04-28 머지)
- **PR #29** `refact/partner-profile-translations` — partner_profile 도 동일 컨벤션 정렬, 7/7 완료 (2026-04-28 머지). FE 짝: hyliren#86

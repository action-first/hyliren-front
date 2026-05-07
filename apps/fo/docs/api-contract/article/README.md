# Article Domain (교육 콘텐츠·SEO)

**역할**: 시술·병원·의료관광 관련 교육 콘텐츠 제공. SEO 랜딩 유입 + 사용자 신뢰 확보.
**Wave**: 🔵 **Wave 3** (성장 단계 진입 시)
**현재 상태**: `apps/fo/src/lib/articles-data.ts` 에 정적 배열로 하드코딩. 본개발 진입 후 상당 기간 이 방식 유지해도 무방.

---

## 왜 Wave 3 인가

프로토타입·초기 실사용자 단계에서 콘텐츠 양이 적음. 정적 배열로도 충분. CMS 백엔드 구축은 **팀이 콘텐츠 퍼블리싱 빈도 > 주 1회** 시점부터 비용 대비 이익. 그 전에 투입하면 미사용 인프라.

---

## 시나리오

```
유저가 검색엔진·광고에서 → /articles/자연쌍꺼풀-가이드 로 유입
    │
    ▼
[H2 GET /articles/:slug] ← SSR 렌더용 기사 데이터
    │
    ▼
기사 읽기 → 관련 고민 → "나도 상담받기" CTA → /consult
    │
    ▼
대시보드/맥락에서 추천 기사 → [H3 GET /articles/recommendations]
```

---

## 엔드포인트 목록

| # | Method | Path | Auth | 목적 |
|---|---|---|---|---|
| H1 | GET | `/api/v1/articles` | — | 기사 목록 |
| H2 | GET | `/api/v1/articles/:slug` | — | 기사 상세 |
| H3 | GET | `/api/v1/articles/recommendations` | ⚠️ | 사용자 맞춤 추천 |

---

## H1. GET /api/v1/articles

### Query

```
?bodyArea=눈|코|리프팅|...
&tag=recovery|price|review
&search=keyword
&sort=newest|popular|recommended
&page=1&limit=10
```

### Response

```json
{
  "success": true,
  "data": {
    "articles": [
      {
        "id": "a-001",
        "slug": "자연쌍꺼풀-매몰법-가이드",
        "title": "자연스러운 쌍꺼풀 만드는 매몰법 완벽 가이드",
        "titleZh": "自然双眼皮埋线完整指南",
        "summary": "매몰법의 장단점과 회복 기간, 비용 범위를 정리했습니다",
        "bodyArea": "눈",
        "category": "guide",
        "tagColor": "info",
        "heroImage": "https://cdn.hyliren.com/articles/a-001.jpg",
        "readMinutes": 5,
        "publishedAt": "2026-03-01T00:00:00Z",
        "viewCount": 1234
      }
    ],
    "total": 42,
    "page": 1,
    "limit": 10
  }
}
```

---

## H2. GET /api/v1/articles/:slug

### Response

```json
{
  "success": true,
  "data": {
    "id": "a-001",
    "slug": "자연쌍꺼풀-매몰법-가이드",
    "title": "자연스러운 쌍꺼풀 만드는 매몰법 완벽 가이드",
    "titleZh": "...",
    "summary": "...",
    "content": "## 매몰법이란?\n\n매몰법은...",  // MD or HTML
    "contentZh": "...",
    "bodyArea": "눈",
    "category": "guide",
    "relatedProcedures": ["매몰 쌍꺼풀", "절개 쌍꺼풀"],
    "heroImage": "https://...",
    "author": { "name": "홍길동 의료기자", "avatarUrl": "https://..." },
    "publishedAt": "2026-03-01T00:00:00Z",
    "updatedAt": "2026-03-15T00:00:00Z",
    "viewCount": 1234,
    "seo": {
      "metaTitle": "자연쌍꺼풀 매몰법 가이드 | MIMYO",
      "metaDescription": "...",
      "ogImage": "https://..."
    }
  }
}
```

### SSR 고려

- Next.js `generateMetadata` 에서 호출 → SEO 메타태그 렌더
- `Cache-Control: public, s-maxage=3600, stale-while-revalidate=86400` (1시간 캐시 + stale 24시간)
- CDN edge 캐시 강제 권장

### Errors

- 404: slug 없음. Next.js `notFound()` 호출로 404 페이지 렌더

---

## H3. GET /api/v1/articles/recommendations

### Query

```
?bodyArea=눈
&status=proposal_received  // 사용자 concern 의 현재 상태
&limit=3
```

### Response

H1 과 같은 shape 의 `articles[]`. 단, pagination 없이 고정 개수.

### 추천 로직 (서버)

현재 FO 는 [apps/fo/src/domain/lifecycle.ts](../../../src/domain/lifecycle.ts) 의 `getRecommendedArticles(bodyArea, status)` 로 클라이언트에서 필터링. **서버로 이동하면 개인화·A/B 테스트·ranking 모델 적용 가능**.

---

## 현재 FO 상태 (마이그레이션 계획)

```
apps/fo/src/lib/articles-data.ts  ← 정적 배열 (총 15~30개)
    │
    ├── import from 'apps/fo/src/app/page.tsx'  (홈 추천 섹션)
    ├── import from 'apps/fo/src/app/articles/page.tsx' (목록)
    ├── import from 'apps/fo/src/app/articles/[slug]/page.tsx' (상세)
    └── import from 'apps/fo/src/app/dashboard/page.tsx' (맞춤 추천)
```

**전환 단계**:
1. H1, H2 real 구현
2. FO 의 `lib/api/article/*` 신설 (types, requests)
3. `articles/[slug]/page.tsx` 가 fetch → `notFound()` handling
4. 맞춤 추천은 `lib/domain/lifecycle.ts` 의 `getRecommendedArticles` 를 서버 API 로 치환 or 클라 유지 (flexible)
5. `articles-data.ts` 제거

---

## CMS 전략

### Option A — 헤드리스 CMS (Strapi, Sanity, Contentful)

장점:
- 마케팅팀·의료 자문 인력이 콘텐츠 직접 편집 가능
- GUI + 이미지 업로드·버전 관리 내장

단점:
- 또 다른 인프라
- 비용 (월 $50~)

### Option B — 자체 BO CMS

장점:
- 비용 0
- 플랫폼 통합

단점:
- 개발 공수 (2~3주)
- WYSIWYG 에디터 선정·유지보수

### Option C — Markdown + Git

장점:
- 콘텐츠가 코드와 함께 버전관리
- 무료
- SEO 에 유리 (정적)

단점:
- 마케터가 Git 다루기 힘듦
- 실시간 업데이트 안 됨

**CTO 추천: Option A (Strapi 오픈소스 self-host) or Option C (시작 단계)**. Option B 는 시간·인력 대비 ROI 낮음.

---

## 다국어

- `titleZh`, `contentZh` 등 nameZh 패턴으로 동시 저장
- 또는 `locale` 별 리소스 분리 — 추천: 콘텐츠량 적은 초기엔 동일 row 에 병기, 많아지면 분리

---

## Mock → Real 전환 체크리스트 (Wave 3)

- [ ] CMS 선정 (Option A/B/C)
- [ ] H1, H2 real 구현
- [ ] FO 의 `articles-data.ts` 제거 + `lib/api/article/*` 신설
- [ ] `articles/[slug]/page.tsx` generateMetadata + 404 처리
- [ ] SEO 메타·OG 이미지 생성 파이프라인
- [ ] H3 추천 API 구현 (필요 시)

---

## 프로토타입 단계에선 이것만 필요

**정적 `articles-data.ts` 유지**. 본개발 진입 후 3개월까지는 이 구조로 충분. 급한 게 아니라 "시점을 알고 있는 부채" 로 기록.

---

## yj.jung 확인 필요

1. CMS 선정 (Legal·마케팅팀과 공동 결정)
2. 기사 `content` 저장 형식: Markdown vs Rich HTML vs Portable Text
3. 작성자·에디터 권한 분리 필요성
4. 콘텐츠 SEO URL slug 전략 (한국어 slug 허용 여부, redirect 규칙)

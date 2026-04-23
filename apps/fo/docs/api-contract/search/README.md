# Search & Recommendation Domain

**역할**: 병원·시술·기사 검색, 자동완성, 개인화 추천.
**Wave**: 🔵 **Wave 3** (MAU 가 쌓인 후 필요)
**현재 상태**: 미구현. 검색 UI 없음. 전제조건 - [member-profile](../member-profile/README.md) · [article](../article/README.md) 가 DB 에 축적된 후.

---

## 왜 Wave 3 인가

프로토타입·초기 사용자 단계에는 데이터 양이 적어 **전문 검색 엔진이 over-engineering**. PG만으로 ILIKE 쿼리 충분.
- 병원: ~수십 개
- 기사: ~수십 개

**ElasticSearch/Algolia 도입 트리거**: 병원 500+ / 기사 200+ / 검색 DAU > 100.

---

## 시나리오

```
/hospitals 페이지 → 지역·전공 필터 → [J1 GET /search]
    │
    ▼
검색창 타이핑 → [J2 GET /suggestions]  (자동완성)
    │
    ▼
결과 클릭 → 병원 상세·기사 상세

---

고민 제출 후 → 대시보드 → [J3 GET /recommendations/hospitals]
    │
    ▼
"당신의 고민과 유사한 사례에서 선택된 병원 TOP 5"
```

---

## 엔드포인트 목록

| # | Method | Path | Auth | 목적 |
|---|---|---|---|---|
| J1 | GET | `/api/v1/search` | — | 통합 검색 (병원·시술·기사) |
| J2 | GET | `/api/v1/suggestions` | — | 자동완성 |
| J3 | GET | `/api/v1/recommendations/hospitals` | ✅ | 사용자 맞춤 병원 추천 |

---

## J1. GET /api/v1/search

### Query

```
?q=자연쌍꺼풀
&type=hospital|treatment|article
&filter[bodyArea]=눈
&filter[priceMax]=300
&sort=relevance|rating|price
&page=1&limit=20
```

### Response

```json
{
  "success": true,
  "data": {
    "results": [
      {
        "type": "hospital",
        "id": "m-001",
        "hospitalName": "강남아이 성형외과",
        "logoUrl": "https://...",
        "specialties": ["눈", "코"],
        "avgRating": 4.7,
        "highlight": "...<em>자연쌍꺼풀</em> 전문...",
        "score": 0.92
      },
      {
        "type": "article",
        "id": "a-001",
        "slug": "자연쌍꺼풀-매몰법-가이드",
        "title": "<em>자연쌍꺼풀</em> 만드는 매몰법 가이드",
        "summary": "...",
        "highlight": "...",
        "score": 0.88
      }
    ],
    "total": 42,
    "page": 1,
    "limit": 20,
    "facets": {
      "type": { "hospital": 15, "article": 23, "treatment": 4 },
      "bodyArea": { "눈": 24, "코": 12, "리프팅": 6 }
    }
  }
}
```

### 설계 고려

- **Unified result** — `type` 필드로 구분. FO 가 type 별로 다른 카드 렌더
- **Highlight** — 검색 키워드 `<em>` 태그로 강조 (XSS 방지: 서버가 미리 escape 한 text)
- **Facets** — 사이드 필터 UI 지원 (결과 좁히기)

### 검색 엔진 옵션

- Wave 3 초기: PostgreSQL Full-Text Search (`tsvector`, `tsquery`) + trigram 인덱스. 무료, 성능 적당
- Wave 3 후기: ElasticSearch / Meilisearch / Algolia — 하이라이트, typo 허용, 한국어 형태소 분석 우수
- **CTO 추천**: Meilisearch (오픈소스, 한국어 지원, self-host 가능, Algolia 비용 절감)

---

## J2. GET /api/v1/suggestions

### Query

```
?q=자연&limit=5
```

### Response

```json
{
  "success": true,
  "data": {
    "suggestions": [
      { "text": "자연쌍꺼풀", "type": "keyword" },
      { "text": "자연스러운 코성형", "type": "keyword" },
      { "type": "hospital", "id": "m-001", "text": "강남아이 성형외과" }
    ]
  }
}
```

### 성능 요구

- p95 latency < 50ms (사용자가 타이핑할 때마다 호출)
- 캐싱: Redis 에 prefix → 결과 map

---

## J3. GET /api/v1/recommendations/hospitals

### Query

```
?concernId=c-001       # 특정 concern 기반 추천
&limit=5
```

또는 (concernId 없이) 사용자 전체 이력 기반 추천:

```
?limit=5
```

### Response

```json
{
  "success": true,
  "data": {
    "recommendations": [
      {
        "memberId": "m-001",
        "hospitalName": "강남아이 성형외과",
        "logoUrl": "https://...",
        "avgRating": 4.7,
        "reason": "similar_concerns_selected",
        "reasonLabel": "비슷한 고민 유저가 많이 선택한 병원",
        "score": 0.89
      }
    ]
  }
}
```

### 추천 로직 (서버)

1. 유사 concern 정의: 같은 `primaryArea` + 예산 교집합 + 방문 예정 겹침
2. 해당 concerns 에서 selected 된 hospital 집계 → 상위 N
3. 사용자가 이미 본 병원은 제외
4. 최근 활동성 가중치 (오래된 선택은 감쇠)

**ML 모델 도입**: Collaborative filtering → Deep learning (Wave 3 후기).

---

## 다국어·번역

- 한국어 검색 — 현 FO 주요 유저
- 중국어 검색 — 타겟 사용자 다수. 검색어 정규화 (간체/번체, 병음 → 한자) 필요
- Wave 3 초기: 한국어만 지원. 중국 사용자는 한국어 병원명 직접 입력 or 페이지 번역 의존

---

## Mock → Real 전환 체크리스트 (Wave 3)

- [ ] 검색 엔진 선정 (PG FTS vs Meilisearch vs ElasticSearch)
- [ ] 데이터 적재 파이프라인 (병원·기사 → 검색 인덱스)
- [ ] J1, J2 구현
- [ ] FO 에 `/search` 페이지 + 헤더 검색바 추가
- [ ] J3 추천 엔진 (간단한 rule-based → 이후 ML)
- [ ] 한국어 형태소 분석기 튜닝

---

## yj.jung 확인 필요

이 도메인은 Wave 3 이므로 지금 결정 보류 가능. 단 다음 사항은 미리 염두:

1. DB 설계 시 검색 컬럼을 `tsvector` 로 생성 가능하게 마이그레이션 여지 남길 것
2. 병원·기사 PUT/PATCH 시 검색 인덱스 재색인 트리거 설계 (webhook or event)

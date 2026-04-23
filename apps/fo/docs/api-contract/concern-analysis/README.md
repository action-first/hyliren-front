# Concern Analysis Domain (AI 고민 분석)

**역할**: 사용자가 입력한 narrative + 사진을 AI 로 분석하여 증상·선호·예산·일정 태그를 추출하고, 가능성 있는 시술 옵션을 추천.
**Wave**: 🔴 **Wave 1** (프로토타입·시연·본개발 모두 핵심 기능)
**현재 상태**: FO 내부에 3-layer service 구현됨 ([apps/fo/src/server/concern-analysis/service.ts](../../../src/server/concern-analysis/service.ts)). 본개발 시 실제 LLM 호출로 교체 or real backend 로 이관 결정 필요.

---

## 이 도메인의 특수성

이 엔드포인트는 **유일하게 LLM 호출이 포함되어 비용·latency 가 큰 엔드포인트**. 일반 CRUD 와 다른 설계 고려 필요:

1. **응답 시간**: 3~10초 정도 예상. FO 가 "processing" step 에서 스피너 + 안내 문구 노출.
2. **비용**: 사용자당 분당 5회 rate limit (남용 방지).
3. **캐싱**: narrative hash 기반 응답 캐싱 검토 (동일 질문 반복 시). 그러나 사진이 포함되면 캐시 hit rate 낮음.
4. **Feedback loop**: 사용자가 AI 결과에 "피드백 턴" 추가하면 재분석. `feedbackTurns` 배열로 대화형 확장.

---

## 시나리오

```
/consult → narrative 입력 → [C1 POST /concern-analysis]
    │
    ▼
   결과 카드 표시 → 사용자 수정 요청
    │
    ▼
"조금 더 자연스럽게" 등 피드백 입력 → [C1 재호출, feedbackTurns 누적]
    │
    ▼
  최종 결과 확인 → POST /api/v1/concerns (domain D) 로 concern 생성
```

---

## 엔드포인트 목록

| # | Method | Path | Auth | 목적 |
|---|---|---|---|---|
| C1 | POST | `/api/v1/concern-analysis` | ⚠️ optional | AI 분석 실행 (초기 분석 + 피드백 반영 재분석 통합) |

현재 프로토타입에는 C2 (별도 feedback 엔드포인트) 없음. `feedbackTurns` 을 C1 요청에 포함시키는 방식으로 단일화.

---

## C1. POST /api/v1/concern-analysis

### Request

```http
POST /api/v1/concern-analysis
Content-Type: application/json

{
  "narrative": "자연스러운 쌍꺼풀을 원해요. 5월에 한국 방문 예정이고 예산은 300만원 정도 생각합니다.",
  "photos": [
    "https://cdn.hyliren.com/uploads/u-001/concern-photo-1.jpg",
    "/mock/photos/eye-front.jpg",
    "blob:..."
  ],
  "feedbackTurns": [
    { "role": "user", "message": "너무 티 나는 건 싫어요" },
    { "role": "ai", "message": "자연스러운 매몰 방식을 중심으로 다시 정리해드렸어요" }
  ]
}
```

### Validation

| 필드 | 규칙 |
|---|---|
| `narrative` | **min 1자 + 품질 refine (CJK 2점·한글 1점·라틴 0.5점, 임계값 10)** — 이모지·공백만 입력 차단 |
| `photos` | URL 또는 path 배열, **최대 3장** |
| `feedbackTurns` | 배열, 각 요소는 `role: "user"|"ai"`, `message: string (min 1)` |

**서버·클라 동일 규칙**: FO 는 이미 [narrative-quality.ts](../../../src/lib/consult/narrative-quality.ts) 로 동일 점수 계산. 서버도 같은 임계값 사용.

### Response — 200 OK

```json
{
  "success": true,
  "data": {
    "extractedTags": {
      "symptoms": ["쌍꺼풀_없음", "눈매_답답함"],
      "preferences": ["자연스러움_선호", "회복_빠름_선호"],
      "budget": ["100~300만원"],
      "timing": ["1개월_내"]
    },
    "extractedSummary": {
      "bodyAreas": ["눈"],
      "primaryArea": "눈",
      "bodyAreaDetail": "자연쌍꺼풀",
      "desiredOutcome": "자연스러운 매몰 쌍꺼풀",
      "budgetMax": 300
    },
    "empathy": "자연스러움을 원하시는 마음, 충분히 이해합니다.",
    "education": "매몰법은 절개보다 회복이 빠르고 수정 부담이 적은 특징이 있습니다.",
    "options": [
      {
        "treatmentName": "매몰 쌍꺼풀",
        "treatmentNameZh": "双眼皮埋线",
        "priceRange": [100, 180],
        "recoveryDays": 5,
        "scarLevel": "minimal",
        "fitScore": 92
      }
    ],
    "ruleVersion": "2026.04"
  }
}
```

### Response 타입 (FO 측)

```ts
// apps/fo/src/server/concern-analysis/types.ts
interface AnalysisResponse {
  extractedTags: {
    symptoms: string[];
    preferences: string[];
    budget: string[];
    timing: string[];
  };
  extractedSummary: {
    bodyAreas: BodyArea[];
    primaryArea: BodyArea;
    bodyAreaDetail: string;
    desiredOutcome: string;
    budgetMax: number | null;
  };
  empathy: string;
  education: string;
  options: Array<{
    treatmentName: string;
    treatmentNameZh?: string;
    priceRange: [number, number];
    recoveryDays: number;
    scarLevel: 'minimal' | 'moderate' | 'visible';
    fitScore: number;  // 0~100
  }>;
  ruleVersion: string;  // "YYYY.MM" — A/B 비교·롤백에 사용
}
```

### Errors

| 상태 | 상황 | message |
|---|---|---|
| 400 | narrative 누락 또는 품질 미달 | "어느 부위가 어떻게 고민이신지 조금 더 구체적으로 알려주세요" |
| 400 | photos 개수 초과 | "사진은 최대 3장까지 가능합니다" |
| 400 | 잘못된 JSON / MIME | "유효한 JSON 요청이 필요합니다" |
| 429 | Rate limit 초과 | "잠시 후 다시 시도해주세요 (분당 5회 제한)" |
| 500 | LLM 호출 실패 | "분석 서비스 일시 오류" — FO 는 fallback 결과 사용 |
| 502 | LLM provider 장애 | 동일 |

### 내부 처리 (참고)

현재 FO 의 3-layer 구현:

```
[Extract]    narrative + photos → tags 추출 (LLM vision + NLP)
     │
     ▼
[Rule]       tags → 매칭되는 시술 후보 선정 (rule engine)
     │
     ▼
[Generation] 매칭 결과 + tags → 최종 응답 생성 (empathy·education·options)
```

각 layer 실패 시 **fallback** 존재 ([service.ts:17-40](../../../src/server/concern-analysis/service.ts)). 본개발 real backend 에서도 동일한 graceful degradation 설계 권장.

### FO 호출처

- [apps/fo/src/components/consult/StepAIProcessing.tsx:40](../../../src/components/consult/StepAIProcessing.tsx#L40) — `/api/concern-analysis` POST
- 응답을 [concern-flow store](../../../src/store/concern-flow.ts) 에 저장 → 이후 submit 시점에 `extractedSummary` 를 concern POST body 에 매핑

---

## 멱등성·캐싱

### Non-idempotent
`feedbackTurns` 가 쌓이면 같은 narrative 라도 결과가 달라짐. 전체 요청을 key 로 캐싱하는 건 현실적이지 않음.

### Partial 캐싱 권장
- (narrative 해시 + photos 해시) → extractResult 캐싱 (L1 layer)
- matchProcedures 결과 (version 기준) 는 rule engine 업데이트 시까지 장기 캐싱 가능
- generation 레이어는 항상 fresh

---

## Rate Limit

| 대상 | 제한 | 이유 |
|---|---|---|
| 유저당 | **분당 5회** | LLM 비용 |
| IP 당 | 분당 10회 | guest 여러 명 공유 IP 허용 |
| 피드백 턴 수 | 요청당 최대 20턴 | 프롬프트 폭증 방지 |

---

## 인증 정책 — 중요

**현재 FO mock**: 인증 없이 호출 가능 (guest 도 AI 체험 가능).

**본개발 권장**: guest 호출 허용하되 **세션 쿠키 또는 임시 토큰 발급**해서 rate limit·이벤트 트래킹 연결. 익명 LLM 호출 남용 방지.

가능한 설계:
1. 앱 첫 진입 시 서버가 `guest_session_id` 쿠키 발급
2. C1 호출 시 이 쿠키 기반으로 rate limit
3. 이후 로그인하면 `guest_session_id` 를 user 와 매핑하여 분석 히스토리 이관

Legal 관점: LLM 호출 로그에 narrative 평문이 남을 수 있음 → 민감정보 마스킹 정책 필요.

---

## Mock → Real 전환 체크리스트

- [ ] Real backend 에 `/api/v1/concern-analysis` 구현 (LLM provider 통합)
- [ ] FO 호출 경로를 `/api/concern-analysis` (Next.js route) 에서 `/api/v1/concern-analysis` (real) 로 전환
- [ ] Response shape 검증 — 현재 FO 의 `AnalysisResponse` 타입과 동일한지
- [ ] Rate limit 적용
- [ ] Fallback 동작 확인 (서버 500 시 FO 가 fallback 결과로 계속 진행)
- [ ] Cost 모니터링 대시보드 연결 (BO 에 LLM 비용 위젯)

---

## yj.jung 확인 필요

1. **LLM provider**: OpenAI GPT-4o vs Anthropic Claude vs 자체 파인튜닝. 비용·latency·성능 trade-off
2. **Photo 분석 여부**: vision 모델 포함 시 비용 ×3. 프로토타입에선 photo URL 만 참조하고 텍스트 분석 중심으로 갈지
3. **Rule engine 저장소**: 시술 매칭 규칙을 DB 에 둘지, 코드에 둘지. 마케팅팀이 수정할 수 있어야 하면 DB + BO UI 필요
4. **Rule version 관리**: semantic versioning? 날짜 기반? A/B 비교 시 식별자
5. **Narrative 저장**: 분석 로그에 narrative 평문 저장 기간. 개인정보 관점 + ML 재학습 데이터 관점 양립

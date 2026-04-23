# Member Profile Domain (병원·파트너 프로필)

**역할**: 제안서를 보낸 병원의 공개 프로필 조회. `memberId` 로 병원 정보를 가져옴.
**Wave**: 🟡 **Wave 2** (proposal embed 로 기본 정보 전달 중이므로 상세 조회는 후순위)
**현재 상태**: FO 가 `MOCK_PARTNER_PROFILES.find()` 로 직접 import 해서 사용 — 본개발 전환 시 전체 제거 필요.

---

## 시나리오

```
/decision 또는 /concerns/:id/proposals 에서 제안 카드 렌더
    │
    ▼ (hospitalName·hospitalLogo 는 이미 proposal 응답에 embed)
  사용자가 "병원 상세 보기" 클릭
    │
    ▼
[F1 GET /members/:memberId/profile] — 병원 전체 프로필 조회
    │
    ▼
  시트 또는 페이지에서 병원 소개·인증·전공·주소·사진 노출
```

---

## 엔드포인트 목록

| # | Method | Path | Auth | 목적 |
|---|---|---|---|---|
| F1 | GET | `/api/v1/members/:memberId/profile` | ⚠️ optional | 병원 상세 프로필 |
| F2 | GET | `/api/v1/members?specialty=&area=&limit=` | — | 공개 병원 디렉토리 (SEO 랜딩용) |

---

## F1. GET /api/v1/members/:memberId/profile

### Response

```json
{
  "success": true,
  "data": {
    "memberId": "m-001",
    "hospitalName": "강남아이 성형외과",
    "hospitalNameZh": "江南EYE整形外科",
    "logoUrl": "https://cdn.hyliren.com/logos/m-001.png",
    "introduction": "눈 성형 전문 20년 경력...",
    "introductionZh": "眼整形专业20年经验...",
    "specialties": ["눈", "코"],
    "certifications": [
      { "type": "의료법인", "issuedBy": "보건복지부", "issuedAt": "2010-05-01" },
      { "type": "외국인환자유치업", "issuedBy": "한국관광공사", "issuedAt": "2018-03-15" }
    ],
    "address": "서울시 강남구 테헤란로 123",
    "addressZh": "首尔特别市江南区德黑兰路123",
    "phone": "+82-2-1234-5678",
    "businessHours": "MON-FRI 10:00-20:00",
    "avgRating": 4.7,
    "reviewCount": 238,
    "photos": [
      { "url": "https://cdn.hyliren.com/hospitals/m-001/entrance.jpg", "caption": "병원 입구" },
      { "url": "https://cdn.hyliren.com/hospitals/m-001/operation-room.jpg", "caption": "수술실" }
    ],
    "doctors": [
      {
        "id": "d-001",
        "name": "김성형",
        "nameZh": "金成型",
        "title": "대표원장",
        "specialties": ["눈"],
        "photoUrl": "https://...",
        "careerYears": 22
      }
    ],
    "createdAt": "2020-01-15T00:00:00Z",
    "updatedAt": "2026-04-01T10:00:00Z"
  }
}
```

### 타입 (FO 측)

```ts
// packages/shared/src/types/member.ts (현재 PartnerProfile 참조)
interface PartnerProfile {
  memberId: string;
  hospitalName: string;
  logoUrl: string | null;
  introduction?: string;
  specialties?: string[];
  // ... 위 response 와 동일하게 확장 필요
}
```

### 인증 정책

- **공개 조회 가능** (authenticated 불필요) — SEO 랜딩 페이지에서도 접근
- 단, 민감 정보 (정확한 가격, 내부 메모) 는 제외

### Cache

- `Cache-Control: public, max-age=300` (5분 캐시)
- CDN 에 올려서 병원 프로필 페이지 트래픽 처리

### FO 호출처

현재 **직접 호출처 없음**. 대신 FO 전체에서 `MOCK_PARTNER_PROFILES.find(p => p.memberId === ...)` 를 9곳에서 사용:

- `apps/fo/src/app/page.tsx:187, 211`
- `apps/fo/src/app/mypage/reports/page.tsx:30`
- `apps/fo/src/app/mypage/reports/[proposalId]/page.tsx`
- `apps/fo/src/app/concerns/[id]/*/page.tsx`
- `apps/fo/src/components/decision/DecisionPageClient.tsx:89`

**Wave 2 에서 일괄 정리 필요**: F1 real deploy 이후 `lib/api/member/*` 훅 신설 → 위 9곳을 `useMember(id)` 같은 훅으로 교체.

---

## F2. GET /api/v1/members (공개 디렉토리)

**Wave 3**. 공개 랜딩 페이지 (`/hospitals`) 의 병원 목록 렌더.

### Query Params

| 이름 | 예시 |
|---|---|
| `specialty` | `눈`, `코`, `리프팅` |
| `area` | `강남`, `청담` (지역 필터) |
| `sort` | `rating | newest | popular` |
| `page`, `limit` | 기본 pagination |

### Response

```json
{
  "success": true,
  "data": {
    "members": [
      {
        "memberId": "m-001",
        "hospitalName": "강남아이 성형외과",
        "logoUrl": "https://...",
        "specialties": ["눈", "코"],
        "avgRating": 4.7,
        "reviewCount": 238
      }
    ],
    "total": 142,
    "page": 1,
    "limit": 20
  }
}
```

F1 보다 가벼운 요약 정보만.

---

## 관련 — Proposal 의 hospital embed

[proposal/README.md](../proposal/README.md) 의 E1 응답에 `hospitalName`, `hospitalLogo` 가 이미 포함. 따라서 **제안서 카드 렌더에는 F1 호출 불필요**. F1 은 "상세 정보 시트/페이지 진입 시" 만 호출.

---

## Mock → Real 전환 체크리스트

- [ ] F1 real 구현
- [ ] `lib/api/member/index.ts`, `lib/api/member/requests.ts`, `lib/api/member/types.ts` 신설
- [ ] `useMember(memberId)` hook 추가
- [ ] FO 의 9곳 `MOCK_PARTNER_PROFILES.find(...)` 를 hook 호출로 교체
- [ ] `MOCK_PARTNER_PROFILES` import 전수 제거
- [ ] F2 는 공개 랜딩 페이지 설계 시점에

---

## yj.jung 확인 필요

1. 다국어 필드 (`hospitalNameZh`, `introductionZh`) 반영 방식 — locale 별 응답 vs 모든 언어 함께 내려받기
2. `avgRating`, `reviewCount` 계산 주체 — real-time vs nightly batch
3. `doctors[]` 를 member 하위로 둘지, 별도 리소스로 분리할지 (`/api/v1/doctors/:id`)
4. `certifications` 데이터 소스 — 수동 입력 vs 정부 API 연동
5. 공개 URL 경로 (`/hospitals/[slug]`) 에 대한 SEO 메타 전략

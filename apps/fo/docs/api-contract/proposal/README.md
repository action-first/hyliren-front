# Proposal Domain (병원 제안서)

**역할**: 병원(partner)이 특정 concern 에 발송한 제안서. 시술 구성, 가격, 일정, 상담 노트를 포함.
**Wave**: 🔴 **Wave 1**
**현재 상태**: FO mock (`/api/v1/concerns/[id]/proposals`, `/api/v1/concerns/[id]/select-hospital`) 완성. PO 가 POST 로 생성.

---

## 시나리오 (소비자 관점)

```
대시보드 → "제안서 도착" 알림 → [E1 GET /concerns/:id/proposals]
                                       │
                                       ▼
                              목록 렌더 (sorted by price)
                                       │
                                       ▼
                        카드 클릭 → 상세 시트 열기 → [E3 POST /proposals/:id/view]
                                       │
                                       ▼
                          /compare 로 비교 → 리포트 구매 (domain G)
                                       │
                                       ▼
                         최종 선택 → [concern D9 select-hospital]
```

---

## 엔드포인트 목록

| # | Method | Path | Auth | 목적 |
|---|---|---|---|---|
| E1 | GET | `/api/v1/concerns/:concernId/proposals` | ✅ | concern 의 제안서 목록 + items 포함 |
| E2 | GET | `/api/v1/proposals/:id` | ✅ | 제안서 개별 상세 (공유 URL 지원) |
| E3 | POST | `/api/v1/proposals/:id/view` | ✅ | 읽음 처리 (`viewedAt` 기록) |
| E4 | POST | `/api/v1/proposals/:id/favorite` | ✅ | 즐겨찾기 토글 (W2) |
| E5 | POST | `/api/v1/proposals/:id/report` | ✅ | 사용자 신고/플래그 (W2) |

---

## E1. GET /api/v1/concerns/:concernId/proposals

### Request

```http
GET /api/v1/concerns/c-001/proposals
Authorization: Bearer ...
```

### Response

```json
{
  "success": true,
  "data": {
    "proposals": [
      {
        "id": "p-001",
        "concernId": "c-001",
        "memberId": "m-001",
        "version": 1,
        "isActive": true,
        "status": "sent",
        "hospitalName": "강남아이 성형외과",
        "hospitalLogo": "https://cdn.hyliren.com/logos/m-001.png",
        "totalPrice": 180,
        "recoveryDays": 5,
        "anesthesiaType": "sedation",
        "hospitalStayDays": 0,
        "availableDateFrom": "2026-05-01",
        "availableDateTo": "2026-05-31",
        "consultationNote": "매몰법 기준 자연스러운 쌍꺼풀...",
        "qualityScore": 87,
        "isFavorite": false,
        "isFlagged": false,
        "creditsCharged": 3,
        "sentAt": "2026-04-10T10:00:00Z",
        "viewedAt": "2026-04-12T14:23:00Z",
        "createdAt": "2026-04-10T10:00:00Z",
        "updatedAt": "2026-04-10T10:00:00Z",
        "deletedAt": null,
        "items": [
          {
            "id": "pi-001",
            "proposalId": "p-001",
            "treatmentName": "매몰 쌍꺼풀",
            "treatmentNameZh": "双眼皮埋线",
            "price": 180,
            "description": "3점 매몰, 부분마취",
            "sortOrder": 0,
            "createdAt": "2026-04-10T10:00:00Z"
          }
        ]
      }
    ],
    "total": 3
  }
}
```

### 주요 필드 의미

| 필드 | 의미 |
|---|---|
| `status` | `sent | viewed | shortlisted | selected | rejected | draft` (서버 저장 상태) |
| `version` | 병원이 제안을 수정하여 재발송하면 증가. 프로토타입에선 항상 1 |
| `isActive` | 파트너가 취소한 proposal 은 `false` (숨김 처리) |
| `hospitalName`, `hospitalLogo` | 서버에서 **join 해서 embed** — FO 가 member-profile API 를 N+1 호출하지 않도록 |
| `qualityScore` | AI 가 평가한 품질 점수 (0~100). 프로토타입엔 null 허용 |
| `creditsCharged` | 병원이 발송 시 지불한 credit (PO 측 비즈니스) |
| `viewedAt` | 사용자가 처음 상세를 열었을 때 갱신. [E3] 과 연동 |
| `items[]` | 시술 항목 목록 (한 제안서에 여러 시술 포함 가능) |

### Sort

서버가 `totalPrice ASC` 로 정렬해서 반환. FO 는 그대로 렌더.

### Errors

- 404: concern 없음 or 타인 소유
- 200 + 빈 배열: 아직 제안 없음 (not-found 아님)

### FO 호출처

- [lib/api/proposal/requests.ts:4](../../../src/lib/api/proposal/requests.ts#L4) — `listProposals(concernId)`
- [lib/hooks/proposal.ts:11](../../../src/lib/hooks/proposal.ts#L11) — `useProposalsForConcern(id)`

---

## E2. GET /api/v1/proposals/:id

**용도**: 개별 제안서 퍼말링크 접근. 공유 링크·알림 notification 에서 바로 진입. 프로토타입 단계에선 선택적.

### Response

E1 의 `proposals[]` 요소와 동일한 shape. `concernId` 포함됨 → FO 가 필요 시 concern 조회 추가.

### Errors

- 404: proposal 없음 or 소유 concern 이 타인 것

---

## E3. POST /api/v1/proposals/:id/view

**용도**: 사용자가 제안서 상세를 처음 열었을 때 `viewedAt` 갱신.

### Request

body 없음.

### Response

```json
{ "success": true }
```

### 멱등성

- 이미 `viewedAt` 이 설정되어 있으면 그대로 두고 200 반환 (덮어쓰지 않음)
- 또는 **최초 viewedAt 은 고정, `lastViewedAt` 만 갱신** — 정책 결정 필요

### 현재 상태

**FO 가 legacy `PATCH /api/proposals { id, viewedAt }` 로 호출 중**. 본개발 시 E3 로 치환 필요.

```ts
// 현재 — apps/fo/src/components/decision/DecisionPageClient.tsx:68
fetch('/api/proposals', {
  method: 'PATCH',
  body: JSON.stringify({ id: proposalId, viewedAt: new Date().toISOString() }),
}).catch(() => {});

// 본개발 후 — lib/api/proposal/requests.ts 에 추가
export async function markProposalViewed(id: string): Promise<void> {
  return request<void>(`/api/v1/proposals/${id}/view`, { method: 'POST' });
}
```

### 대안 — track 이벤트로 통합

E3 대신 `POST /api/v1/events { eventType: 'proposal_viewed', targetId }` 로 처리하고 서버가 이벤트 스트림에서 viewedAt 파생 가능. analytics pipeline 이 갖춰지면 자연스럽게 전환.

---

## E4. POST /api/v1/proposals/:id/favorite (Wave 2)

### Request

```json
{ "isFavorite": true }
```

### Response

```json
{ "success": true, "data": { "isFavorite": true } }
```

멱등성: 토글이 아니라 **명시적 set** 으로 설계. 클라이언트가 optimistic update 하기 쉬움.

---

## E5. POST /api/v1/proposals/:id/report (Wave 2)

사용자가 이상한 제안 (과대광고, 허위정보 등) 을 신고.

### Request

```json
{
  "reason": "false_advertising" | "overpriced" | "unresponsive" | "other",
  "detail": "병원이 실제로 전화 응대가 되지 않습니다"
}
```

### Response

```json
{ "success": true }
```

BO 에 알림 → 관리자 검토 → `isFlagged = true` 또는 제안서 invalidate.

---

## 필드별 검증·주의사항 (E1)

### `status` 매핑

FO 의 wire → domain 변환:

```ts
// packages/shared/src/constants/enums.ts
PROPOSAL_STATUSES = ['draft', 'sent', 'viewed', 'shortlisted', 'selected', 'rejected']

// FO 측에서 화면용 상태 매핑 (mapper.ts)
wire.status === 'accepted' → UI 'accepted'
wire.status === 'rejected' → UI 'rejected'
wire.status === 'draft' → UI 'draft'
otherwise → UI 'sent'
```

### `hospitalName`·`hospitalLogo` embed 필요성

현재 FO 는 이 두 필드를 E1 응답 내에서 **직접 사용**. Member 프로필을 N+1 조회하면 UX 느려짐 + N+1 쿼리 문제. 서버에서 join 한 상태로 보내주는 게 필수.

### `creditsCharged`

PO 측 비즈니스 필드. 고객이 보는 화면에 노출 안 됨. 서버가 반환해도 무방하나 불필요한 노출 피하려면 FO 전용 응답에서 제외 가능. **yj.jung 과 확인 필요**: 필드 포함 여부.

---

## 병원 선택과의 관계 — 중요

Concern 의 [D9 select-hospital] 을 호출하면:

- `hospital_selections` 테이블에 row 추가
- `concern.status → closed`
- **`proposal.status` 는 변경되지 않음** (yj.jung 확정)

즉 proposal 의 `status` 는 "이 concern 이 이 proposal 을 선택했는가" 를 직접 반영하지 않음. FO 는 `concern.selectedHospital.proposalId` 로 선택 여부 판별.

---

## Mock → Real 전환 체크리스트

- [ ] E1 real deploy — wire shape 일치 확인 (특히 `hospitalName` embed)
- [ ] E2 real 구현 (공유 링크 필요 시)
- [ ] E3 real 구현 + FO 의 legacy `PATCH /api/proposals` 호출 제거
- [ ] E4, E5 (Wave 2)
- [ ] `apps/fo/src/app/api/proposals/route.ts` legacy 삭제 (현재 PATCH viewedAt 용도로 남아있음)
- [ ] `apps/fo/src/app/api/v1/concerns/[id]/proposals/route.ts` mock 삭제

---

## yj.jung 확인 필요

1. `creditsCharged` 를 소비자 응답에 포함할지
2. `qualityScore` 계산 주체·주기 — AI 가 분석하는 시점 vs 정적 룰
3. `version` 필드의 의미 — 제안서 재발송 시 새 row 생성 vs 같은 row 에 version 증가
4. E3 (`/view`) 신설 vs event stream 활용 — 집계 쿼리 복잡도 고려
5. proposal 에 `images[]` 필드도 필요한가? (`ProposalImage` 타입이 shared 에 정의되어 있음)

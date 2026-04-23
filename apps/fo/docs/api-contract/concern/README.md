# Concern Domain (고민 리소스)

**역할**: 사용자가 등록하는 "고민" — 시술 관련 문제 서술, 사진, 예산, 방문 일정을 묶은 리소스. 병원(partner)이 이 concern 을 보고 제안서(proposal)를 발송.
**Wave**: 🔴 **Wave 1** (핵심 리소스)
**현재 상태**: FO mock 이 모든 엔드포인트 제공 중. real backend 의 contract 는 yj.jung 의 `concern.service.ts` 와 이미 정렬됨 (Q&A 로 확정).

---

## 시나리오

```
/consult (AI 분석 완료) → [D3 POST /concerns] (draft 생성)
                              │
                              ▼
              사진·상세 수정 → [D4 PATCH /concerns/:id]  (DRAFT 상태에서만)
                              │
                              ▼
                [D5 POST /concerns/:id/submit]  (draft → submitted)
                              │
                              ▼
                 병원들이 제안서 발송 (PO 측 흐름)
                              │
                              ▼
              제안서 도착 → [D1 GET /concerns] proposalCount 증가
                              │
                              ▼
             [D9 POST /concerns/:id/select-hospital] (최종 선택)
                              │
                              ▼
              concern.status → closed (hospital_selected)
```

---

## 엔드포인트 목록

| # | Method | Path | Auth | 목적 |
|---|---|---|---|---|
| D1 | GET | `/api/v1/concerns` | ✅ | 내 고민 목록 + proposalCount |
| D2 | GET | `/api/v1/concerns/:id` | ✅ | 고민 상세 + photos + selectedHospital |
| D3 | POST | `/api/v1/concerns` | ✅ | 고민 생성 (draft) |
| D4 | PATCH | `/api/v1/concerns/:id` | ✅ | 고민 수정 (DRAFT 전용) |
| D5 | POST | `/api/v1/concerns/:id/submit` | ✅ | draft → submitted 전이 |
| D6 | DELETE | `/api/v1/concerns/:id` | ✅ | soft delete |
| D7 | POST | `/api/v1/concerns/:id/photos` | ✅ | 사진 추가 |
| D8 | DELETE | `/api/v1/concerns/:id/photos/:photoId` | ✅ | 사진 삭제 |
| D9 | POST | `/api/v1/concerns/:id/select-hospital` | ✅ | 최종 병원 선택 |

---

## 상태 머신

```
      draft ──submit──▶ submitted ──select-hospital──▶ closed (hospital_selected)
        │                                                 ▲
        │                                                 │
        └───────────────── (취소) ──────── cancelled      │
                                                          │
                                 (오퍼 없이 만료) ─────────┘ closed (completed)
```

**DB 저장 상태 (`concern.status`)**: `draft | submitted | closed | cancelled`

**FO 가 파생하는 상태**: proposalCount + selectedHospital 조합으로 `proposal_received`, `comparing`, `hospital_selected`, `completed` 파생. `mapStatus()` in [apps/fo/src/lib/api/concern/mapper.ts](../../../src/lib/api/concern/mapper.ts).

**중요**: 서버는 3단계(draft/submitted/closed)만 저장. FO 가 UI 상 세분화를 처리.

---

## D1. GET /api/v1/concerns

### Request

```http
GET /api/v1/concerns?status=submitted&page=1&limit=20
Authorization: Bearer ...
```

### Query Params

| 이름 | 타입 | 필수 | 기본 |
|---|---|---|---|
| `status` | `draft | submitted | closed | cancelled` | — | 전체 |
| `page` | int ≥ 1 | — | 1 |
| `limit` | int 1~100 | — | 20 |

### Response

```json
{
  "success": true,
  "data": {
    "concerns": [
      {
        "id": "c-001",
        "status": "submitted",
        "source": "organic",
        "description": "자연스러운 쌍꺼풀을 하고 싶어요...",
        "primaryArea": "눈",
        "bodyAreas": ["눈"],
        "bodyAreaDetail": "매몰쌍꺼풀",
        "budgetMin": 100,
        "budgetMax": 300,
        "visitDateFrom": "2026-05-01",
        "visitDateTo": "2026-05-15",
        "proposalCount": 3,
        "createdAt": "2026-03-16T14:00:00Z",
        "updatedAt": "2026-04-01T10:00:00Z"
      }
    ],
    "total": 4,
    "page": 1,
    "limit": 20
  }
}
```

### 주의

- **`userId` 필드는 반환하지 않음** — 이미 authenticated user 목록이므로 불필요. FO mapper 는 `userId: ''` 로 매핑 (이게 client-side 필터링 버그의 원인이 된 적 있음 — [fix #10](https://github.com/action-first/hyliren-front/pull/10))
- **서버가 auth.userId 로 필터링** — 클라이언트는 재필터링하지 않음

### FO 호출처

- [apps/fo/src/lib/api/concern/requests.ts:15](../../../src/lib/api/concern/requests.ts#L15) — `listConcerns()`
- [apps/fo/src/lib/hooks/concern.ts:13](../../../src/lib/hooks/concern.ts#L13) — `useMyConcerns()` 훅 (dashboard·decision 등이 사용)

---

## D2. GET /api/v1/concerns/:id

### Response

```json
{
  "success": true,
  "data": {
    "id": "c-001",
    "userId": "u-001",
    "status": "submitted",
    "source": "organic",
    "description": "...",
    "primaryArea": "눈",
    "bodyAreas": ["눈"],
    "bodyAreaDetail": "매몰쌍꺼풀",
    "hasPassport": true,
    "aiSummary": { /* optional JSON */ },
    "budgetMin": 100,
    "budgetMax": 300,
    "visitDateFrom": "2026-05-01",
    "visitDateTo": "2026-05-15",
    "proposalCount": 3,
    "createdAt": "2026-03-16T14:00:00Z",
    "updatedAt": "2026-04-01T10:00:00Z",
    "deletedAt": null,
    "photos": [
      { "id": "cp-001", "url": "/mock/photos/eye-front.jpg", "sortOrder": 0 },
      { "id": "cp-002", "url": "/mock/photos/eye-side.jpg", "sortOrder": 1 }
    ],
    "selectedHospital": {
      "id": "m-001",
      "proposalId": "p-001",
      "selectedAt": "2026-04-20T10:00:00Z"
    }
  }
}
```

**D1 과 차이**: `userId`, `photos`, `selectedHospital`, `aiSummary`, `hasPassport` 포함. list 는 가볍게, detail 은 풍부하게.

### Errors

- **404**: concern 없음 or 타인 소유 (통합 응답 — IDOR 방어)
  ```json
  { "success": false, "statusCode": 404, "message": "Not found" }
  ```

### FO 호출처

- [lib/api/concern/requests.ts:25](../../../src/lib/api/concern/requests.ts#L25) — `getConcern(id)`
- [lib/hooks/concern.ts:36](../../../src/lib/hooks/concern.ts#L36) — `useConcern(id)`

---

## D3. POST /api/v1/concerns

### Request

```json
{
  "description": "자연스러운 쌍꺼풀 원해요. 5월 방문 예정, 예산 300만원.",
  "areas": ["눈"],
  "detail": "매몰법이 궁금합니다",
  "budgetMin": 100,
  "budgetMax": 300,
  "visitDateFrom": "2026-05-01",
  "visitDateTo": "2026-05-15",
  "photos": [
    "https://cdn.hyliren.com/uploads/u-001/photo-1.jpg"
  ],
  "source": "organic"
}
```

### Validation

| 필드 | 규칙 |
|---|---|
| `description` | **required**, trim 후 1~5000자, narrative quality refine (이모지·공백 단독 차단) |
| `areas` | optional, string 배열, 최대 10개. enum 밖 값도 허용 (서버 원본 저장, FO mapper 가 `'기타'` 로 정규화) |
| `detail` | optional, 최대 500자 |
| `budgetMin`, `budgetMax` | optional, 정수 ≥ 0, min ≤ max refine |
| `visitDateFrom`, `visitDateTo` | optional, `YYYY-MM-DD` 포맷, from ≤ to refine |
| `photos` | optional, URL 또는 path 배열, 최대 3장 |
| `source` | optional, string, 기본 `'organic'` — 현재 `CONCERN_SOURCES = ['organic','referral','article','ad','direct']` |

**strict mode**: `userId`, `id`, `status`, `createdAt` 등 system 필드는 body 에서 오면 **400 Unrecognized key** 로 거부.

### Response — 201 Created

```json
{
  "success": true,
  "data": { "id": "c-1776905098294" }
}
```

### Real backend 동작 (yj.jung 확인 완료)

- `primaryArea = areas?.[0] || '기타'`
- `bodyAreas = areas || []` (빈 배열로 저장)
- unknown `bodyAreas` 값은 **원본 그대로 저장** (DB jsonb 컬럼)
- FO mapper (`toBodyArea`) 가 읽기 시점에 enum 밖 값을 `'기타'` 로 정규화

### FO 호출처

- [lib/api/concern/requests.ts:29](../../../src/lib/api/concern/requests.ts#L29) — `createConcern(body)`
- [components/consult/StepConfirm.tsx:93](../../../src/components/consult/StepConfirm.tsx#L93) — submit 흐름

---

## D4. PATCH /api/v1/concerns/:id

### Request (허용 필드만)

```json
{
  "description": "수정된 설명",
  "budgetMin": 150,
  "budgetMax": 400,
  "visitDateFrom": "2026-06-01",
  "visitDateTo": "2026-06-30"
}
```

### 허용 필드 (whitelist)

- `description`
- `budgetMin`, `budgetMax`
- `visitDateFrom`, `visitDateTo`

**그 외** (특히 `areas`, `detail`, `photos`, `userId`, `status`) 는 **400 Unrecognized key**.

**사진 수정**은 [D7]/[D8] 로 분리.
**부위 변경**은 현재 지원 안 함 — 고민 삭제 후 재생성 필요. (향후 필요 시 논의)

### 상태 제약

- `concern.status === 'draft'` 인 경우에만 허용
- 아니면 **404 `"Concern must be in draft status"`** (403 아님 — 정책)

### Response

```json
{ "success": true }
```

### FO 호출처

- [lib/api/concern/requests.ts:33](../../../src/lib/api/concern/requests.ts#L33) — `updateConcern(id, body)`

---

## D5. POST /api/v1/concerns/:id/submit

### Request

body 없음. Idempotency key 불필요 (상태 기반 중복 차단).

### Response

```json
{ "success": true }
```

### 동작

- `draft → submitted` 전이
- `updatedAt` 갱신
- 이 시점에 **병원 매칭 로직 트리거** (매칭 규칙: 지역, 전공, 예산 범위 교집합) — 해당 병원들에게 notification

### Errors

| 상태 | 상황 |
|---|---|
| 404 | concern 없음 or 타인 소유 |
| 404 | 이미 submitted 상태 (`"Concern must be in draft status"`) |

### FO 호출처

- [lib/api/concern/requests.ts:37](../../../src/lib/api/concern/requests.ts#L37) — `submitConcern(id)`
- [components/consult/StepConfirm.tsx:94](../../../src/components/consult/StepConfirm.tsx#L94)

---

## D6. DELETE /api/v1/concerns/:id

**Soft delete**: `deletedAt = now`. row 삭제하지 않음.

### Response

```json
{ "success": true }
```

### 제약

- `status === 'draft'` 또는 `status === 'closed'` 인 경우에만 삭제 허용
- `submitted` 상태에서는 거부 (활성 제안이 있을 수 있음) — 404 or 409 중 선택 (현재 프로토타입 미구현, 정책 결정 필요)

### FO 호출처

현재 FO 에 삭제 UI 없음. Wave 2 에서 `/mypage` 에 삭제 버튼 추가 예정.

---

## D7. POST /api/v1/concerns/:id/photos

### Request

```http
POST /api/v1/concerns/:id/photos
Content-Type: multipart/form-data

file: <binary>
sortOrder: 0
```

또는 presigned URL 업로드 후:

```json
{
  "url": "https://cdn.hyliren.com/uploads/...",
  "sortOrder": 0
}
```

### Response — 201

```json
{
  "success": true,
  "data": {
    "id": "cp-123",
    "url": "https://cdn.hyliren.com/uploads/...",
    "sortOrder": 0
  }
}
```

### 제약

- MIME: `image/jpeg`, `image/png`, `image/webp`
- 크기: 개당 최대 5MB
- concern 당 **최대 3장**
- concern.status === 'draft' 에서만 추가 가능 (submit 후 변경 금지)

### FO 호출처

현재 FO 의 `PhotoUploadPanel` 은 로컬 URL (blob:) 만 다루고 업로드는 concern POST 시 `photos` 배열로 한꺼번에. Wave 2 진입 시 presigned URL 기반으로 분리.

---

## D8. DELETE /api/v1/concerns/:id/photos/:photoId

### Response

```json
{ "success": true }
```

### 제약

- concern.status === 'draft' 에서만
- 사진은 S3 에서도 삭제 (비용 절감) — 비동기 작업 큐 권장

---

## D9. POST /api/v1/concerns/:id/select-hospital

### Request

```json
{ "proposalId": "p-001" }
```

### Response

```json
{
  "success": true,
  "data": {
    "id": "c-001",
    "proposalId": "p-001"
  }
}
```

### 동작

- `hospital_selections` 테이블에 concernId UNIQUE row 추가
- `concern.status → closed`
- FO 의 GET 응답에서 `selectedHospital: {...}` 로 노출
- proposal.status 자체는 건드리지 않음 (yj.jung 확정)

### Errors

| 상태 | 상황 | message |
|---|---|---|
| 400 | proposalId 형식 오류 | "유효한 제안서 ID가 아닙니다" |
| 404 | concern 없음 or 타인 소유 | "Not found" |
| 404 | proposalId 가 이 concern 의 것이 아님 | "Proposal not found for this concern" |
| **409** | 이미 병원 선택됨 | **"Hospital already selected for this concern"** |

### FO 호출처

- [lib/api/proposal/requests.ts:8](../../../src/lib/api/proposal/requests.ts#L8) — `selectHospital({concernId, proposalId})`

---

## Mock → Real 전환 체크리스트

- [ ] D1~D9 real 구현 완료
- [ ] FO `lib/api/concern/*` 는 이미 yj.jung contract 기반이라 **변경 불필요**
- [ ] `apps/fo/src/app/api/v1/concerns/**/*.ts` mock 전체 삭제
- [ ] FO 컴포넌트 중 아직 `MOCK_CONCERNS` 직접 import 하는 페이지 정리 (`apps/fo/src/app/page.tsx`, `mypage`, `concerns/[id]/compare`, `proposals`, `services`) — 별도 리팩토링 PR
- [ ] D7 사진 업로드 로직 (multipart or presigned) 확정 및 `PhotoUploadPanel` 교체
- [ ] Draft 상태에서 30일 경과 시 자동 cancelled 처리 정책 (BO cronjob)

---

## yj.jung 확인 필요

1. Draft 장기 보관 정책 (30일? 90일?)
2. Submitted 후 N일 내 제안 0건이면 자동 closed? 알림?
3. `aiSummary` 저장 여부 — analysis 결과를 concern 에 embed? 별도 테이블?
4. `hasPassport` 는 user 프로필로 이동하는 게 맞지 않을까? 현재 concern 에 중복
5. D6 (삭제) 상태 제약 — submitted 에서도 허용할지

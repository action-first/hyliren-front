# 공통 설계 원칙 (API Contract Overview)

모든 도메인 README 가 암묵적으로 전제하는 공통 규약. **여기서 정의한 내용은 도메인별 README 에서 중복 서술하지 않습니다.**

---

## 1. Base URL / 환경 변수

### 1.1 FO 클라이언트에서 호출하는 base URL

```ts
// apps/fo/src/lib/env.ts
NEXT_PUBLIC_CUSTOMER_API_BASE_URL = 'http://localhost:9000'  // 개발
// 본개발 전환 시 → 'https://api.hyliren.com' (예시)
```

**원칙**: FO 컴포넌트는 **절대 외부 URL 을 직접 호출하지 않습니다**. 다음 두 방식만 사용:

```
[컴포넌트] → [lib/api/*]  → request<T>(path)  → customerApiBaseUrl
         └─ [/api/* Next.js route handler] (mock 전용, 본개발 시 proxy 로 교체 or 제거)
```

현재 FO 에는 `/api/v1/concerns/*` 등 mock route handler 가 남아있는데, **본개발 진입 시점에 모두 제거** 하고 `lib/api/*` 가 직접 real backend 를 호출하도록 전환합니다.

---

## 2. Envelope 형식

**모든 응답**은 다음 구조를 따릅니다. `success: false` 인 경우 `message` 또는 `error` 중 최소 하나 포함.

```ts
interface Envelope<T> {
  success: boolean;
  data?: T;
  statusCode?: number;   // HTTP status (400/401/404/409/422/5xx)
  message?: string | string[];  // 사용자에게 노출 가능한 한국어 메시지 (프로토타입 기준)
  error?: string;        // 개발자용 에러 코드 (예: 'UNAUTHORIZED', 'VALIDATION_FAILED')
}
```

### 2.1 성공 응답 예

```json
{
  "success": true,
  "data": { "id": "c-123", "status": "draft" }
}
```

### 2.2 실패 응답 예

```json
{
  "success": false,
  "statusCode": 404,
  "message": "Concern must be in draft status"
}
```

### 2.3 현재 FO 클라이언트의 envelope 처리

[apps/fo/src/lib/api/client.ts:42-50](../../src/lib/api/client.ts#L42-L50) 의 `parseEnvelope<T>()` 가 이 계약을 읽고, `ApiError(status, code, message)` 로 변환해 상위 호출자에게 throw. 서버가 위 형식을 지키기만 하면 FO 클라이언트는 수정 없이 동작.

---

## 3. 인증·세션

### 3.1 토큰 전달

- 헤더: `Authorization: Bearer <accessToken>`
- Body·쿼리에 토큰 포함 금지
- CORS 허용 필요: 개발 단계 `http://localhost:9000`, 본개발 운영 도메인

### 3.2 Access Token 만료 시 흐름

```
[Client 요청]  → 401
      ↓
[Client: refresh 시도]  POST /auth/refresh { refreshToken }
      ↓ 성공
[Client: 원래 요청 재시도]  (skipRefresh 플래그로 무한루프 방지)
```

**동시성 제어**: [apps/fo/src/lib/api/client.ts:58-70](../../src/lib/api/client.ts#L58-L70) 의 `refreshOnce()` 가 단일 Promise 를 공유하여 401 폭주 시에도 refresh 호출은 1회로 제한됨.

### 3.3 강제 로그아웃 트리거

다음 상황에서 서버가 `refreshToken` 을 invalidate 하면 FO 는 token 삭제 + `onForcedLogout` 리스너 호출:

- refresh token 만료·폐기
- 동시 로그인 세션 제한 초과 (정책)
- 관리자 강제 차단 (위반 사용자)

---

## 4. Pagination

### 4.1 Request

```
GET /api/v1/{resource}?page=1&limit=20&status=submitted
```

### 4.2 Response

```json
{
  "success": true,
  "data": {
    "items": [ ... ],
    "total": 42,
    "page": 1,
    "limit": 20
  }
}
```

### 4.3 상한·기본값

| 리소스 | 기본 limit | 최대 limit | 비고 |
|---|---|---|---|
| `concerns` | 20 | 100 | 유저당 고민 수는 보통 10건 이하라 일반적으로 페이지네이션 불필요 |
| `proposals` | 20 | 50 | concern 당 proposal 은 최대 10~20건 |
| `articles` | 10 | 50 | 목록 페이지 UX 기준 |

대용량 리소스 (events, logs) 는 **커서 기반 pagination** 도입 권장 (`?cursor=&limit=`). Wave 3 이후.

---

## 5. 에러 응답 규약

### 5.1 HTTP 상태 코드 의미 통일

| 코드 | 의미 | FO 동작 |
|---|---|---|
| 400 | 입력 검증 실패 (zod 포함) | `message` 를 UI 에 노출. 폼 필드 하이라이트 |
| 401 | 인증 필요 / 만료 | `/auth/refresh` 자동 시도. 실패 시 로그아웃 |
| 403 | 인증은 유효하나 권한 부족 (예: 타인의 리소스를 명시적 수정 시도) | "권한이 없습니다" 토스트 |
| 404 | 리소스 없음 or 소유권 불일치 or 상태 불일치 (`"must be in draft status"` 등) | 화면에 not-found UI 노출 |
| 409 | 멱등성 위배 / 중복 / 상태 충돌 (예: 병원 이미 선택됨) | `message` 를 UI 에 노출 |
| 422 | 비즈니스 규칙 위배 (예: 쿠폰 만료) | `message` 노출 |
| 5xx | 서버 장애 | "서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요." 안내 |

### 5.2 IDOR 및 소유권 체크

**원칙**: 타인의 리소스에 접근 시도할 경우 `404` 로 통일. `403` 은 사용하지 않음 (리소스 존재 여부 노출 방지).

예: `GET /api/v1/concerns/c-001` 에 다른 사용자 토큰으로 접근 → `404 "Not found"` (concern 은 실재하지만 내가 소유자 아님).

### 5.3 메시지 다국어 처리 — Wave 3 결정 필요

**현재 프로토타입**: 서버 메시지를 한국어로 고정해서 보냄. FO 가 그대로 렌더.

**본개발 옵션**:
- (a) 서버가 `Accept-Language` 헤더 보고 해당 언어로 반환
- (b) 서버는 key (`auth.error.invalidCredentials`) 만 반환, FO 가 `packages/i18n` 로 번역

**추천**: (b). 서버에 번역 리소스 파일 유지하는 비용이 큼. FO 는 이미 ko/zh-CN i18n 파이프라인 있음.

---

## 6. Timestamp·Timezone

- 모든 timestamp 는 **ISO 8601 UTC** (`"2026-04-23T14:00:00.000Z"`)
- 날짜만 필요한 필드 (`visitDateFrom`, `visitDateTo`) 는 **YYYY-MM-DD** (로컬 시간 가정, 서버는 해석 안 함)
- FO 의 `mapper.ts` 가 ISO 문자열을 그대로 저장. 표시 시점에 사용자 locale 기준으로 `Intl.DateTimeFormat` 사용

---

## 7. 멱등성 (Idempotency)

### 7.1 멱등 키 필요한 엔드포인트

돈·상태 전이가 일어나는 POST 에는 `Idempotency-Key` 헤더를 수용하는 것을 권장:

| 엔드포인트 | 이유 |
|---|---|
| `POST /api/v1/orders/report` | 결제 중복 방지 |
| `POST /api/v1/orders/service` | 시술 예약 중복 방지 |
| `POST /api/v1/payments/confirm` | PG 콜백 재전송 대비 |

### 7.2 멱등 키 동작

- 같은 키로 중복 POST → 최초 응답과 동일한 응답 반환 (새 리소스 생성 안 함)
- 24시간 TTL 권장
- 서버가 Redis 등에 `{key} → {response}` 저장

### 7.3 상태 기반 거부

상태 전이 API (`POST /submit`, `POST /select-hospital`) 는 멱등 키 대신 **상태 검사로 이중 호출 방어**:

- `/submit` 이 이미 `submitted` 상태면 → `404 "must be in draft status"`
- `/select-hospital` 에 이미 선택된 concern → `409 "Hospital already selected"`

---

## 8. Rate Limiting

| 엔드포인트 군 | 제한 | 이유 |
|---|---|---|
| `POST /api/v1/concern-analysis` | **유저당 분당 5회** | LLM 호출 비용 |
| `POST /auth/login` | **IP 당 분당 10회** | 브루트포스 방지 |
| `POST /auth/register` | **IP 당 시간당 5회** | 봇 방지 |
| `POST /api/v1/events` | **유저당 초당 20회** | 이벤트 스팸 방지 |
| 일반 GET | **유저당 초당 30회** | DDoS 완충 |

초과 시 `429 Too Many Requests` + `Retry-After` 헤더.

---

## 9. 파일 업로드

### 9.1 허용 파일

| 리소스 | MIME | 최대 크기 | 최대 개수 |
|---|---|---|---|
| Concern photo | `image/jpeg`, `image/png`, `image/webp` | **5MB** | **3장** |
| User avatar | 위와 동일 | 2MB | 1장 |

### 9.2 업로드 전략

**프로토타입 단계** (지금): multipart/form-data, 서버가 직접 저장.

**본개발 권장**:
- Presigned URL (S3) 발급 → 클라이언트가 S3 직업로드 → 완료 후 `POST /api/v1/concerns/:id/photos` 에 URL·메타만 등록
- 중국 이용자 대상: Alibaba Cloud OSS 리전 이중화 고려 (Wave 3)

---

## 10. 보안 원칙

### 10.1 모든 :id 엔드포인트에서 소유권 검증

```
const concern = getConcern(id);
if (!concern || concern.userId !== auth.userId) return 404;
```

FO 는 서버를 신뢰하고 client-side 재필터링 하지 않습니다. (이전에 `DecisionPageClient` 에서 이 원칙을 어긴 사례 있음 — 버그로 이어짐)

### 10.2 Mass assignment 차단

`PATCH` 에서는 허용 필드 whitelist 로만 업데이트. `userId`, `status`, `id`, `createdAt`, `deletedAt` 등 시스템 필드는 body 에서 오면 **400 Unrecognized key** 로 거부 (zod `.strict()` 기본 동작).

### 10.3 입력 검증 (서버 측)

- 모든 POST/PATCH 에 zod 또는 동급 라이브러리로 검증
- description 등 자유 텍스트 필드는 최대 길이 제한 (5000자)
- 이모지·공백만 입력 차단 (`isNarrativeQualityEnough` 로직 참조)
- XSS 페이로드는 저장 허용하되 렌더 시 escape (React 기본 동작). 필요 시 서버에서 HTML stripping 추가 고려

### 10.4 로깅

- 민감 정보 (password, refreshToken, payment token) 은 로그에 남기지 않음
- PII (phone, email) 은 user_id 로 치환해 logs 에 기록 권장
- 에러 스택트레이스는 response 에 노출 금지 (현재 일부 mock 이 500 시 에러 메시지 유출 — 본개발 시 수정)

---

## 11. 버전 관리

- 데이터 리소스: `/api/v1/*`
- 세션·토큰: `/auth/*` (별도 네임스페이스)
- Breaking change 시: `/api/v2/*` 병행 → FO 먼저 마이그레이션 → 일정 기간 후 v1 폐기

---

## 12. 개발·스테이징·운영 환경

| 환경 | FO | Backend | 용도 |
|---|---|---|---|
| 로컬 | `localhost:9000` | `localhost:9000` (mock) | 프로토타입·단위 개발 |
| Dev | `dev.hyliren.com` | `dev-api.hyliren.com` | 통합 테스트 |
| Staging | `staging.hyliren.com` | `staging-api.hyliren.com` | 리허설·법무 검토 |
| Prod | `hyliren.com` | `api.hyliren.com` | 운영 |

**환경별 `.env` 분리는 필수**. 프로토타입 기간 중 이 구조를 미리 세우면 본개발 합류 시 혼란 감소.

---

## 13. FO 에서 mock 제거 타이밍

현재 FO 에는 `apps/fo/src/app/api/**/route.ts` 로 수많은 mock 핸들러가 존재합니다. **한꺼번에 제거하지 않고** 도메인별로 Wave 를 따라 단계적으로 제거:

1. 해당 도메인 real backend 엔드포인트 deploy + smoke test
2. `apps/fo/.env.local` 의 `API_MODE` 스위치 또는 해당 `lib/api/*/requests.ts` 의 path 만 변경
3. `/api/v1/*` mock route handler 파일 삭제
4. 페이지 smoke 통과 확인

**원칙**: `lib/api/**` 의 client 코드는 mock/real 둘 다에서 동일하게 동작해야 합니다. 현재 이 원칙은 이미 지켜지고 있음 — `request<T>` 가 상대 경로만 받으므로 base URL 만 바꾸면 됨.

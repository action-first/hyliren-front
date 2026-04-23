# Auth Domain

**역할**: 세션·토큰·회원가입. 모든 도메인의 전제조건.
**Wave**: 🔴 **Wave 1** (이미 yj.jung client 계약 완성. 서버 구현만 남음)
**현재 상태**: FO 클라이언트 전체 완성. FO mock route handler 가 `test@test.com / 123123123` 단일 계정만 지원.

---

## 시나리오

```
[신규 방문]  ──→  landing
                   │
                   ▼
               /consult 진입 (guest 로도 탐색 가능)
                   │
                   ▼  (submit 직전 or 기능별 gate)
              AuthModal 노출
                   │
                   ├─→ 이메일 입력 → [A2 login] 성공 → 세션 확립
                   │                    │
                   │                    └─ 401 → [A1 register] 흐름으로 전환
                   └─→ 신규 가입 → [A1 register] → 세션 확립
                   │
                   ▼
           토큰 저장 (tokenStore) + /auth/me [A5] 호출로 user state 초기화
                   │
                   ▼
             API 호출 시 Bearer 헤더 자동 부착
                   │
                   ▼ (401 발생 시)
             [A3 refresh] 자동 → 원래 요청 재시도 (client.ts:refreshOnce)
                   │
                   ▼ (refresh 실패 시)
             tokenStore.clearTokens() + onForcedLogout 브로드캐스트
                   │
                   ▼
              [A4 logout] — 명시적 로그아웃 (optional, server-side revocation)
```

---

## 엔드포인트 목록

| # | Method | Path | Auth | 목적 |
|---|---|---|---|---|
| A1 | POST | `/auth/register` | — | 이메일 회원가입 |
| A2 | POST | `/auth/login` | — | 이메일 로그인 |
| A3 | POST | `/auth/refresh` | — | accessToken 재발급 (refreshToken 필요) |
| A4 | POST | `/auth/logout` | ✅ | 현재 세션 종료 (서버 측 refresh token 폐기) |
| A5 | GET | `/auth/me` | ✅ | 현재 사용자 정보 |

---

## A1. POST /auth/register

**용도**: 이메일/비밀번호로 회원가입. 자동 로그인까지 한 번에 처리.

### Request

```http
POST /auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "MinLength8",
  "name": "홍길동",
  "locale": "ko",
  "referralCode": "optional-invite-code"
}
```

### Validation

| 필드 | 규칙 |
|---|---|
| `email` | RFC 5322, 최대 255자 |
| `password` | 최소 8자, 영문+숫자 1자 이상씩 (FO `PASSWORD_RULE` 참조) |
| `name` | trim 후 1~50자 |
| `locale` | `ko` \| `zh-CN` \| `en` (기본 `ko`) |
| `referralCode` | optional, 문자열 |

### Response — 201 Created

```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGci...",
    "refreshToken": "eyJhbGci..."
  }
}
```

### Errors

| 상태 | 상황 | message |
|---|---|---|
| 400 | password 규칙 위배 | "비밀번호는 8자 이상, 영문과 숫자를 포함해야 합니다" |
| 400 | email 형식 오류 | "이메일 형식이 올바르지 않습니다" |
| 409 | email 중복 | "이미 가입된 이메일입니다" |

### FO 호출처

- [apps/fo/src/lib/api/auth.ts:72](../../../src/lib/api/auth.ts#L72) — `register({...})`
- [apps/fo/src/store/auth.ts](../../../src/store/auth.ts) — `registerWithPassword` 액션
- [apps/fo/src/components/auth/AuthModal.tsx:80](../../../src/components/auth/AuthModal.tsx#L80) — `handleRegisterSubmit`

### Mock 현황

[apps/fo/src/app/auth/register/route.ts] — 존재하지 않음 (FO mock 은 register 시나리오 미지원. `test@test.com/123123123` 고정 계정만). **real backend 에서 구현 필수.**

---

## A2. POST /auth/login

**용도**: 이메일/비밀번호 로그인.

### Request

```http
POST /auth/login
Content-Type: application/json

{
  "email": "test@test.com",
  "password": "123123123"
}
```

### Response — 200 OK

```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGci...",
    "refreshToken": "eyJhbGci..."
  }
}
```

### Errors

| 상태 | 상황 | message |
|---|---|---|
| 400 | 필수 필드 누락 | "이메일과 비밀번호를 입력해주세요" |
| 401 | 비밀번호 불일치 | "Invalid credentials" (→ FO 는 i18n 키 `auth.error.invalidCredentials` 로 번역) |
| 401 | 계정 없음 | **의도적으로 같은 401 반환** (계정 존재 여부 노출 방지) |
| 429 | Rate limit | "너무 많은 시도입니다. 잠시 후 다시 시도해주세요" |

### 현재 mock 동작

[apps/fo/src/app/auth/login/route.ts](../../../src/app/auth/login/route.ts) — `test@test.com / 123123123` 하드코딩. 토큰은 `mock-access-test@test.com` 형식으로 이메일 포함. **real 에서는 JWT 또는 opaque token 사용.**

### FO 호출처

- [apps/fo/src/lib/api/auth.ts:62](../../../src/lib/api/auth.ts#L62) — `login({...})`
- [apps/fo/src/store/auth.ts](../../../src/store/auth.ts) — `loginWithPassword` 액션
- [apps/fo/src/components/auth/AuthModal.tsx:62](../../../src/components/auth/AuthModal.tsx#L62) — `handleLoginSubmit`

---

## A3. POST /auth/refresh

**용도**: accessToken 만료 시 재발급. FO client 가 **자동 호출** — 사용자 UI 에 직접 노출되지 않음.

### Request

```http
POST /auth/refresh
Content-Type: application/json

{
  "refreshToken": "eyJhbGci..."
}
```

### Response — 200 OK

```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGci...",
    "refreshToken": "eyJhbGci..."
  }
}
```

### Errors

| 상태 | 상황 | 처리 |
|---|---|---|
| 401 | refreshToken 만료·폐기 | FO 가 `notifyForcedLogout('refresh_failed')` 호출 → 세션 전체 폐기 |
| 401 | refreshToken 형식 오류 | 동일 |

### 중요 정책

- **Refresh token rotation**: 매 refresh 시 새 refresh token 발급 + 이전 것 폐기 (token reuse 탐지로 탈취 방어)
- **동시성**: FO 는 `refreshOnce()` 로 단일 Promise 공유. 서버 쪽은 race 발생해도 idempotent 하게 동일 token pair 반환하면 이상적 (또는 첫 요청만 성공하고 나머지는 최신 token 을 돌려주는 전략)

### FO 호출처

- [apps/fo/src/lib/api/client.ts:62](../../../src/lib/api/client.ts#L62) — `runRefresh()` 내부 fetch

---

## A4. POST /auth/logout

**용도**: 명시적 로그아웃. 서버가 현재 refresh token 을 invalidate.

### Request

```http
POST /auth/logout
Authorization: Bearer <accessToken>
```

body 없음.

### Response — 200 OK

```json
{ "success": true }
```

### Errors

- 401: 이미 만료 — FO 는 이 경우에도 token 삭제 후 계속 진행 (graceful)

### FO 호출처

- [apps/fo/src/lib/api/auth.ts:89](../../../src/lib/api/auth.ts#L89) — `logout()`

---

## A5. GET /auth/me

**용도**: 현재 사용자 정보 조회. 앱 진입 시 세션 복원, 프로필 업데이트 후 재조회 등에 쓰임.

### Request

```http
GET /auth/me
Authorization: Bearer <accessToken>
```

### Response — 200 OK

```json
{
  "success": true,
  "data": {
    "id": "u-001",
    "role": "buyer",
    "email": "test@test.com",
    "phone": null,
    "name": "테스트 유저",
    "locale": "ko",
    "avatarUrl": null,
    "referralCode": null,
    "referredBy": null,
    "createdAt": "2026-03-16T14:00:00Z"
  }
}
```

### Response 타입 (FO 측)

```ts
// packages/shared/src/types/user.ts
interface User {
  id: string;
  role: 'buyer' | 'partner' | 'admin';
  email: string;
  phone: string | null;
  name: string;
  locale: 'ko' | 'zh-CN' | 'en';
  avatarUrl: string | null;
  referralCode: string | null;
  referredBy: string | null;
  createdAt: string;  // ISO 8601
}
```

### Errors

| 상태 | 상황 |
|---|---|
| 401 | 토큰 없음·만료·형식 오류 |

### FO 호출처

- [apps/fo/src/lib/api/auth.ts:96](../../../src/lib/api/auth.ts#L96) — `me()`
- [apps/fo/src/components/auth/SessionBootstrap.tsx](../../../src/components/auth/SessionBootstrap.tsx) — 앱 마운트 시 세션 복원

---

## 토큰 저장 정책

### 현재 (프로토타입)

- `localStorage` 에 `accessToken`·`refreshToken` 저장 ([apps/fo/src/lib/auth/token-store.ts](../../../src/lib/auth/token-store.ts))
- XSS 공격에 취약 (프로토타입 단계 허용)

### 본개발 권장

- **Access token**: in-memory (Zustand state)
- **Refresh token**: `httpOnly; secure; sameSite=strict` 쿠키
- 서버가 refresh 엔드포인트에서 `Set-Cookie` 헤더로 쿠키 갱신
- FO 에서 쿠키 읽기·쓰기 불필요 (브라우저가 자동 전송)

**전환 비용**: `token-store.ts` + `client.ts` 리팩토링 + 서버 쿠키 발급 로직 추가. 약 4~6시간. Wave 2 초반에 반드시 완료 필요.

---

## 소셜 로그인 (Wave 3)

중국 이용자 대상 제품이므로 **WeChat 로그인 우선**. Google/Apple 은 글로벌 확장 시.

```
POST /auth/wechat
  { code: "...", state: "..." }
  → { accessToken, refreshToken, user: {...} }
```

UI 는 이미 [AuthModal.tsx](../../../src/components/auth/AuthModal.tsx) 에 "위챗으로 시작하기 (준비 중)" placeholder 있음.

---

## 비밀번호 재설정 (Wave 2)

- `POST /auth/password-reset/request` `{email}` → email 발송
- `POST /auth/password-reset/confirm` `{token, newPassword}` → 변경 완료

---

## 이메일 인증 (Wave 2)

가입 시점에서 이메일 소유 여부는 확인하지 않음 (중국 사용자는 이메일 사용 빈도 낮음). 대신 주요 액션 (결제, 시술 예약) 직전에 **phone OTP** 요구.

```
POST /auth/phone/request  { phone: "+82-10-1234-5678" }  → OTP 발송
POST /auth/phone/confirm  { phone, code }  → 세션에 phone verified = true 기록
```

---

## Mock → Real 전환 체크리스트

- [ ] `/auth/login` real deploy → `.env` 의 `NEXT_PUBLIC_CUSTOMER_API_BASE_URL` 변경
- [ ] `/auth/register` real deploy (현재 mock 없음 → 전환 시 즉시 효과)
- [ ] `/auth/refresh` real deploy + rotation 정책 확인
- [ ] `/auth/logout` real deploy + refresh token 폐기 확인
- [ ] `/auth/me` real deploy + `User` wire shape 일치 확인
- [ ] Token 저장을 httpOnly 쿠키로 전환 (Wave 2 시점)
- [ ] Rate limit 적용 확인 (login 10/min, register 5/hour)
- [ ] `apps/fo/src/app/auth/**/route.ts` mock 전체 삭제
- [ ] 로그인·로그아웃·세션 복원 E2E 테스트

---

## yj.jung 확인 필요

1. **토큰 형식**: JWT (자체 포함) vs opaque token (서버 조회 필요). refresh rotation 구현 난이도에 영향
2. **Refresh token 유효기간**: 30일? 7일?
3. **Access token 유효기간**: 15분? 1시간?
4. **동시 세션 허용**: 한 유저가 여러 기기 동시 로그인 가능? 제한 수?
5. **회원가입 후 welcome email**: 발송 담당 (backend vs 별도 email service)?

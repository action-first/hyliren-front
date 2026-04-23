# User Domain

**역할**: 사용자 프로필·설정·여권 정보.
**Wave**: 🟡 **Wave 2** (auth 완료 후, 첫 실유저 온보딩 전)
**현재 상태**: FO 가 `/auth/me` 로 기본 User 정보만 조회 중. 프로필 편집·설정 기능 미구현.

---

## 시나리오

```
[로그인 완료]
   │
   ▼
/mypage 진입 → user 기본 정보 표시
   │
   ├─→ 이름·전화·언어 편집 → [B2 PATCH /users/me]
   ├─→ 아바타 업로드 → [B3]
   └─→ 여권 업로드 (해외 시술 예약 요건) → [B5]
         │
         ▼
    관리자 승인 대기 → 승인 후 order 흐름에서 사용
```

---

## 엔드포인트 목록

| # | Method | Path | Auth | 목적 |
|---|---|---|---|---|
| B1 | GET | `/api/v1/users/me` | ✅ | 내 프로필 상세 (편집용 — auth/me 보다 많은 필드) |
| B2 | PATCH | `/api/v1/users/me` | ✅ | 프로필 업데이트 |
| B3 | POST | `/api/v1/users/me/avatar` | ✅ | 아바타 업로드 |
| B4 | GET | `/api/v1/users/me/passport` | ✅ | 여권 인증 상태 |
| B5 | POST | `/api/v1/users/me/passport` | ✅ | 여권 제출 |

---

## B1. GET /api/v1/users/me

**auth/me 와의 차이**: auth/me 는 세션 복원용 최소 정보. users/me 는 프로필 편집 화면용 **확장 정보** (주소, 선호 시술, 마케팅 수신 동의 등).

### Response

```json
{
  "success": true,
  "data": {
    "id": "u-001",
    "email": "test@test.com",
    "name": "테스트 유저",
    "phone": "+82-10-1234-5678",
    "locale": "ko",
    "avatarUrl": "https://cdn.hyliren.com/avatars/u-001.jpg",
    "passportVerified": false,
    "marketingConsent": {
      "email": true,
      "sms": false,
      "push": true
    },
    "preferences": {
      "primaryInterest": ["눈", "코"],
      "budgetRange": "100to300"
    },
    "createdAt": "2026-03-16T14:00:00Z",
    "updatedAt": "2026-04-01T10:00:00Z"
  }
}
```

### Errors

- 401: 인증 필요

---

## B2. PATCH /api/v1/users/me

### Request

```json
{
  "name": "김철수",
  "phone": "+82-10-9999-9999",
  "locale": "zh-CN",
  "marketingConsent": { "email": false }
}
```

### 허용 필드 (whitelist)

```
name, phone, locale, avatarUrl, marketingConsent, preferences
```

그 외 필드는 **400 Unrecognized key** 로 거부. 특히 `id`, `email`, `role`, `createdAt` 등.

**email 변경**은 별도 엔드포인트 (`POST /users/me/email-change` + 인증 코드) 로 분리 권장.

### Response

```json
{ "success": true }
```

### Errors

| 상태 | 상황 |
|---|---|
| 400 | 필드 검증 실패 (`phone` 형식, `locale` enum 외 값) |
| 400 | whitelist 외 필드 포함 |

---

## B3. POST /api/v1/users/me/avatar

**전략**: 파일 크기 작으므로 multipart 직접 수용 OK. (사진 3장 이상인 concern 은 presigned URL 고려)

### Request

```http
POST /api/v1/users/me/avatar
Authorization: Bearer ...
Content-Type: multipart/form-data

file: <binary>
```

### Response

```json
{
  "success": true,
  "data": {
    "avatarUrl": "https://cdn.hyliren.com/avatars/u-001.jpg"
  }
}
```

### 제약

- MIME: `image/jpeg`, `image/png`, `image/webp`
- 최대 2MB
- 서버에서 자동 resize (예: 400×400 crop)

### Errors

- 400: MIME 불일치, 크기 초과
- 413: Payload too large

---

## B4. GET /api/v1/users/me/passport

```json
{
  "success": true,
  "data": {
    "status": "pending" | "verified" | "rejected" | "not_submitted",
    "submittedAt": "2026-04-20T09:00:00Z" | null,
    "verifiedAt": null,
    "rejectReason": null
  }
}
```

---

## B5. POST /api/v1/users/me/passport

### Request

```http
POST /api/v1/users/me/passport
Content-Type: multipart/form-data

passportNumber: "M12345678"
issuedCountry: "CN"
file: <binary>
```

### Response

```json
{
  "success": true,
  "data": { "status": "pending" }
}
```

### 검토 흐름

- 업로드 직후: `status: pending`
- BO 관리자가 이미지 확인 후 승인/반려
- 반려 시 `rejectReason` 포함 — FO 가 UI 에 표시하여 재제출 유도

### 보안

- 여권 이미지는 S3 에 암호화 저장 (SSE-KMS)
- DB 에는 `passportNumber` 를 해시·토큰화해서만 저장
- BO 에서만 복호화된 이미지 열람 가능
- GDPR·개인정보보호법 대응 중요 — Legal 리뷰 필수

---

## FO 호출처 (현재·예정)

- 현재 `/mypage/page.tsx` 가 `user` 객체만 사용 (auth/me 기반). B1~B5 아직 미사용
- Wave 2 진입 시 `apps/fo/src/app/mypage/edit/page.tsx` 신설 후 B1, B2 연동

---

## Mock → Real 전환 체크리스트

- [ ] B1 deploy — User 확장 필드 (passportVerified, preferences 등) 추가
- [ ] B2 whitelist 검증
- [ ] B3 파일 업로드 경로 + S3 설정
- [ ] B4·B5 여권 인증 워크플로 + BO 쪽 승인 툴
- [ ] `apps/fo/src/app/mypage/edit/*` 페이지 구현 (이번 문서 범위 외)

---

## yj.jung 확인 필요

1. `User` 의 `preferences` 필드 구조를 지금 확정할지, JSON blob 으로 유연하게 시작할지
2. 여권 이미지 OCR 자동화 여부 (수동 승인만 vs OCR + 관리자 확인)
3. phone 형식 — E.164 (`+82-10-...`) vs 국가별 형식

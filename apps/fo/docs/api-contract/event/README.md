# Event Analytics Domain

**역할**: 사용자 행동 이벤트 수집. 퍼널 분석·A/B 테스트·실시간 대시보드의 기반.
**Wave**: 🔴 **Wave 1** (track() 이 FO/PO/BO 공통 tracker 이므로 이미 사용 중)
**현재 상태**: `@hyliren/shared/events/tracker.ts` 가 `POST /api/events` 로 fire-and-forget 호출. FO·PO·BO 모든 앱이 동일 엔드포인트 사용.

---

## 시나리오

```
[컴포넌트] → track({ eventType, actorType, targetType?, targetId?, metadata })
    │
    ▼ (fire-and-forget, 실패 시 swallow)
[I1 POST /api/events]
    │
    ▼ (서버)
이벤트 저장 + (비동기) 데이터 웨어하우스로 적재
    │
    ▼
BO 대시보드·프로덕트 분석·퍼널 리포트 쿼리
```

---

## 엔드포인트 목록

| # | Method | Path | Auth | 목적 |
|---|---|---|---|---|
| I1 | POST | `/api/v1/events` | ⚠️ optional (anonymous 수용) | 이벤트 로깅 |
| I2 | POST | `/api/v1/events/batch` | ⚠️ optional | 다수 이벤트 일괄 전송 (Wave 2 성능 최적화) |

---

## I1. POST /api/v1/events

### Request

```http
POST /api/v1/events
Content-Type: application/json

{
  "eventType": "concern_submit_completed",
  "actorType": "user",
  "actorId": "u-001",
  "targetType": "concern",
  "targetId": "c-1776905098294",
  "metadata": {
    "source": "fo",
    "locale": "ko",
    "label": "눈",
    "value": "3"
  }
}
```

### 타입 (FO 측)

```ts
// packages/shared/src/events/tracker.ts (현재)
interface TrackEvent {
  eventType: string;                                      // 자유 문자열
  actorType: 'user' | 'partner' | 'admin' | 'system';
  actorId?: string;
  targetType?: string;
  targetId?: string;
  metadata?: Record<string, string>;                      // 자유 key-value
}
```

### Response — 204 No Content 권장

이벤트 추적은 fire-and-forget. 클라이언트는 응답을 기다리지 않음 ([tracker.ts:48](../../../packages/shared/src/events/tracker.ts#L48)의 `.catch(() => {})`).

```
HTTP/1.1 204 No Content
```

`204` 가 어려우면 최소한:

```json
{ "success": true }
```

### 인증 정책

- **Anonymous 수용**: 로그인 전 이벤트 (페이지 뷰, 상담 시작 등) 도 추적 필요. 서버가 `guest_session_id` 쿠키로 identity 연결
- **Authenticated**: `Authorization` 헤더 있으면 서버가 `actorId` 덮어쓰기 (클라가 보낸 actorId 무시 — spoofing 방지)

### Rate Limit

- 유저당 초당 20회
- 초과 시 429 — 그러나 fire-and-forget 이므로 FO 는 무시

---

## 이벤트 네이밍 컨벤션

`{domain}_{action}_{outcome?}` 패턴. 예:

- `concern_submit_started`
- `concern_submit_completed`
- `concern_submit_blocked_unauth`
- `dashboard_viewed`
- `compare_entered`
- `compare_intent_clicked`
- `proposal_viewed`
- `report_purchased`
- `waiting_panel_viewed`

**원칙**: 서버는 eventType 을 enum 으로 고정하지 않음 — 프로토타입 단계에서 자유롭게 추가. Wave 2 에서 schema registry 도입 검토.

---

## 현재 FO 가 발생시키는 이벤트 목록 (참고)

| eventType | actorType | 언제 |
|---|---|---|
| `concern_submit_started` | user | StepConfirm handleConfirm 진입 시 |
| `concern_submit_completed` | user | API 201 성공 후 |
| `concern_submit_blocked_unauth` | user | 401 받고 auth modal 유도 시 |
| `dashboard_viewed` | user | Dashboard 렌더 |
| `compare_entered` | user | /compare 페이지 진입 |
| `compare_intent_clicked` | user | 제안 카드에서 "비교" 의도 표현 |
| `report_purchased` | user | SingleAnalysisPreview 에서 구매 버튼 클릭 |
| `waiting_panel_viewed` | user | Dashboard waiting phase 에서 패널 렌더 |

Wave 2 추가 예정:
- `signup_completed`
- `signup_phone_verified`
- `order_created`
- `payment_confirmed`
- `hospital_selected`

---

## I2. POST /api/v1/events/batch (Wave 2)

**용도**: 클라이언트가 단시간에 여러 이벤트 발생 시 네트워크 호출 절약. FO 가 큐에 쌓고 배치 전송.

### Request

```json
{
  "events": [
    { "eventType": "page_scrolled", "actorId": "u-001", "metadata": { "scrollDepth": "50%" } },
    { "eventType": "button_hovered", "actorId": "u-001", "metadata": { "buttonId": "cta-consult" } }
  ]
}
```

### Response

```json
{ "success": true, "data": { "accepted": 2, "rejected": 0 } }
```

---

## 데이터 저장 아키텍처

### 즉시 저장 (hot path)

- PostgreSQL `events` 테이블
- 7일 보관 → 이후 ClickHouse 또는 BigQuery 로 archive

### 장기 분석 (warm path)

- ClickHouse / BigQuery 에 매일 적재
- BO 대시보드·퍼널 쿼리

**프로토타입 단계**: data-store.ts in-memory `events[]`. BO `/events` 페이지에서 바로 조회.

---

## 보안·개인정보 고려

### 민감정보 마스킹

`metadata` 안에 PII (email, phone) 포함 금지. FO 개발 시 `track()` 호출 직전 sanitize:

```ts
// 나쁜 예
track({ metadata: { email: user.email } });

// 좋은 예
track({ actorId: user.id, metadata: { source: 'fo' } });
```

### 저장 기간

- 개인식별 가능 이벤트 (actorId 포함): 12개월 후 actorId 해시화
- 집계 이벤트 (scrollDepth, pageViews 등): 5년 유지 가능

### GDPR·개인정보보호법

- 사용자가 "내 데이터 삭제 요청" 시 해당 actorId 의 이벤트 12개월 내 삭제
- BO 에 관리 툴 필요

---

## 쿼리 사용 예시 (BO 분석 팀 참고)

### 퍼널 분석

```sql
-- concern submit 전환율 (최근 7일)
SELECT
  COUNT(*) FILTER (WHERE event_type = 'concern_submit_started') AS started,
  COUNT(*) FILTER (WHERE event_type = 'concern_submit_completed') AS completed,
  COUNT(*) FILTER (WHERE event_type = 'concern_submit_blocked_unauth') AS blocked_auth
FROM events
WHERE timestamp > NOW() - INTERVAL '7 days';
```

### 리포트 구매 전환율

```sql
SELECT
  COUNT(*) FILTER (WHERE event_type = 'compare_entered') AS compare_views,
  COUNT(*) FILTER (WHERE event_type = 'report_purchased') AS purchased,
  (COUNT(*) FILTER (WHERE event_type = 'report_purchased'))::float /
  NULLIF(COUNT(*) FILTER (WHERE event_type = 'compare_entered'), 0) AS conversion_rate
FROM events
WHERE timestamp > NOW() - INTERVAL '30 days';
```

---

## Mock → Real 전환 체크리스트

- [ ] I1 real 구현 — 현재 FO mock `/api/events` 를 real proxy 로 교체 or 경로 변경
- [ ] PostgreSQL `events` 테이블 스키마 설계
- [ ] BigQuery·ClickHouse 적재 파이프라인 (Wave 2)
- [ ] I2 batch 엔드포인트 (성능 필요 시)
- [ ] BO 이벤트 관리 UI — 사용자별 이벤트 조회, 삭제 요청 처리

---

## yj.jung 확인 필요

1. `events` 테이블 스키마: JSONB metadata vs 컬럼화
2. actorId 해시화 시점·알고리즘
3. batch API 도입 시점
4. 실시간 스트리밍 필요 여부 (Kafka/Redis Streams)
5. 샘플링 전략 — 고빈도 이벤트 (스크롤) 는 1/N 만 저장

# Order & Payment Domain

**역할**: 리포트 구매·시술 예약 결제·후기. 매출 발생 전제. PG 연동 필수.
**Wave**: 🟡 **Wave 2** (첫 실사용자 유입 전 필수. 프로토타입 단계에선 mock 만 존재)
**현재 상태**: `POST /api/payments` 가 존재하나 **PG 연동 없음**. `addPayment(body)` 로 저장만. 본개발 진입 시 전면 재설계 필요.

---

## 이 도메인의 특수성

결제는 다른 도메인과 달리:

1. **제3자 시스템 (PG) 연동** — 토스페이먼츠·Stripe·WeChat Pay
2. **돈이 움직이므로 멱등성·원자성 절대 필수**
3. **웹훅 수신 서버 별도 구성** 권장
4. **Legal·컴플라이언스** (현금영수증, 전자세금계산서, 결제승인 보관)
5. **환불 플로우** 첫 사용자 유입 전 반드시 구축

CTO 경험 기반 권고: **토스페이먼츠 우선 채택** — 한국 카드·현금·페이 네이버페이 등 통합 처리. 중국 WeChat Pay 는 Series A 이후 확장.

---

## 시나리오

### 리포트 구매 흐름

```
/decision 에서 제안 카드 클릭 → 상세 시트 → "리포트 확인하기" CTA
    │
    ▼
[G1 POST /orders/report { proposalId }]  → { orderId, paymentUrl|paymentIntentSecret }
    │
    ▼
PG widget (토스페이먼츠 SDK) 호출 → 사용자가 결제 완료
    │
    ▼
[G2 POST /payments/confirm { orderId, paymentKey, amount }] ← PG 응답 전달
    │
    ▼ (서버 측 PG 서버 검증 → order.status = paid)
FO 화면에서 리포트 해금 (SingleAnalysisPreview 의 블러 해제)
    │
    ▼
[G5 GET /reports/:proposalId]  ← 상세 리포트 데이터
```

### 시술 예약 흐름 (Wave 3)

```
리포트 확인 후 → "이 병원 선택하기" → concern D9 select-hospital
    │
    ▼
병원 쪽 계약서 확정 → [G6 POST /orders/service { proposalId, depositAmount }]
    │
    ▼
PG 결제 → 보증금 결제 → 방문일 확정 → 시술 → 최종 정산
    │
    ▼
시술 후 → [G7 POST /proposals/:id/reviews]
```

---

## 엔드포인트 목록

| # | Method | Path | Auth | 목적 | Wave |
|---|---|---|---|---|---|
| G1 | POST | `/api/v1/orders/report` | ✅ | 리포트 주문 생성 | W2 |
| G2 | POST | `/api/v1/payments/confirm` | ✅ | 결제 승인 확인 | W2 |
| G3 | GET | `/api/v1/orders?type=&status=` | ✅ | 내 주문 목록 | W2 |
| G4 | GET | `/api/v1/orders/:id` | ✅ | 주문 상세 | W2 |
| G5 | GET | `/api/v1/reports/:proposalId` | ✅ | 리포트 조회 (구매자만) | W2 |
| G6 | POST | `/api/v1/orders/service` | ✅ | 시술 예약 보증금 주문 | W3 |
| G7 | POST | `/api/v1/proposals/:id/reviews` | ✅ | 후기 등록 | W3 |
| GW | POST | `/webhook/payments/toss` | — (서버 간) | PG 비동기 웹훅 | W2 |

---

## G1. POST /api/v1/orders/report

**용도**: 리포트 구매 의도 표명. 서버가 주문 생성 + PG 세션 발급.

### Request

```http
POST /api/v1/orders/report
Authorization: Bearer ...
Content-Type: application/json
Idempotency-Key: <UUID v4>

{
  "proposalId": "p-001",
  "amount": 4900,
  "currency": "KRW"
}
```

### Idempotency

- **필수**. 같은 key 로 재호출 시 동일한 `orderId` + `paymentUrl` 반환 (새 주문 생성 안 함)
- 24시간 TTL
- FO 는 user action 당 1회 UUID 생성하여 재사용 (중복 클릭·재시도 방어)

### Response — 201 Created

```json
{
  "success": true,
  "data": {
    "orderId": "o-1776905000",
    "amount": 4900,
    "currency": "KRW",
    "status": "pending",
    "paymentSession": {
      "provider": "toss",
      "paymentKey": "prov-session-key-xxx",
      "clientKey": "toss-public-key",
      "checkoutUrl": "https://payment.toss.im/checkout/xxx"
    },
    "expiresAt": "2026-04-23T15:00:00Z"
  }
}
```

### 검증

| 필드 | 규칙 |
|---|---|
| `proposalId` | 필수. user 가 소유한 concern 의 proposal 이어야 함 |
| `amount` | 필수. 정수 KRW, 서버가 정가(`reportPrice`) 와 일치 확인 — 클라가 조작한 amount 거부 |
| `currency` | `KRW` 만 (Wave 2). 위안·달러는 Wave 3 |

### Errors

| 상태 | 상황 |
|---|---|
| 400 | amount 조작 (정가와 불일치) |
| 404 | proposalId 없음 or 타인 소유 |
| 409 | 이미 이 proposal 에 대해 paid 주문 존재 |

---

## G2. POST /api/v1/payments/confirm

**용도**: PG 결제 완료 후 FO 가 서버에 confirm 요청. 서버가 PG 서버에 재검증.

### Request

```http
POST /api/v1/payments/confirm
Authorization: Bearer ...

{
  "orderId": "o-1776905000",
  "paymentKey": "toss-payment-key-xxx",
  "amount": 4900
}
```

### 서버 처리

1. `orderId` 로 order 조회 (소유권 확인)
2. PG 서버에 **server-to-server** 승인 요청 (토스페이먼츠 `POST /v1/payments/confirm`)
3. PG 응답의 amount 가 order.amount 와 일치 확인
4. `order.status = paid`, `payment` row 생성, `paymentKey` 저장
5. 리포트 해금 (user 의 purchasedReports 에 proposalId 추가)

### Response

```json
{
  "success": true,
  "data": {
    "orderId": "o-1776905000",
    "status": "paid",
    "paidAt": "2026-04-23T14:30:00Z",
    "report": {
      "proposalId": "p-001",
      "reportUrl": "/mypage/reports/p-001"
    }
  }
}
```

### Errors

| 상태 | 상황 | 처리 |
|---|---|---|
| 400 | amount mismatch | order 취소 + PG 환불 요청 |
| 409 | 이미 confirm 된 주문 | 현재 상태 그대로 반환 (멱등) |
| 502 | PG 서버 장애 | 재시도 유도, 사용자에게 안내 |

### 대안 — 웹훅 기반

PG 가 서버에 비동기 웹훅 (`POST /webhook/payments/toss`) 을 쏘도록 설정하면 FO confirm 호출 실패해도 서버가 승인 처리 가능. **이중 경로 모두 구현 권장**.

---

## G3. GET /api/v1/orders

### Query

```
?type=report|service
&status=pending|paid|refunded|cancelled
&page=1&limit=20
```

### Response

```json
{
  "success": true,
  "data": {
    "orders": [
      {
        "id": "o-001",
        "type": "report",
        "status": "paid",
        "amount": 4900,
        "currency": "KRW",
        "proposalId": "p-001",
        "hospitalName": "강남아이 성형외과",
        "createdAt": "2026-04-12T14:00:00Z",
        "paidAt": "2026-04-12T14:02:00Z"
      }
    ],
    "total": 2,
    "page": 1,
    "limit": 20
  }
}
```

### FO 위치

`/mypage/orders` — 사용자가 결제 이력 조회.

---

## G4. GET /api/v1/orders/:id

주문 상세. 영수증·환불 버튼 포함.

```json
{
  "success": true,
  "data": {
    "id": "o-001",
    "type": "report",
    "status": "paid",
    "amount": 4900,
    "currency": "KRW",
    "payment": {
      "provider": "toss",
      "method": "card",
      "cardCompany": "현대카드",
      "cardLast4": "1234",
      "installment": 0
    },
    "receipt": {
      "url": "https://cdn.hyliren.com/receipts/o-001.pdf",
      "taxInvoiceAvailable": true
    },
    "refund": {
      "refundable": true,
      "refundDeadline": "2026-04-19T14:00:00Z"
    }
  }
}
```

---

## G5. GET /api/v1/reports/:proposalId

**용도**: 구매 완료된 리포트 상세 조회.

### Response

```json
{
  "success": true,
  "data": {
    "proposalId": "p-001",
    "priceScore": 85,
    "priceVerdict": "시장 평균 대비 합리적...",
    "priceBreakdown": [
      { "itemName": "매몰 쌍꺼풀", "proposalPrice": 180, "marketAvg": 195, "marketRange": [150, 250], "verdict": "fair" }
    ],
    "overtreatmentVerdict": "제시된 시술 구성은 합리적...",
    "necessaryItems": ["매몰 쌍꺼풀"],
    "unnecessaryItems": [],
    "riskVerdict": "부분마취 전제 회복 빠름...",
    "riskFactors": ["감염 0.1% 이내", "잔흔 최소"],
    "generatedAt": "2026-04-12T14:03:00Z"
  }
}
```

### Errors

| 상태 | 상황 |
|---|---|
| 403 | **구매 안 한 사용자** — 리포트 미노출. 프론트는 이 케이스 자체가 발생 안 해야 정상 (구매 없이 URL 조작) |
| 404 | proposalId 없음 |

**Option 논쟁**: 403 vs 404. 프로토타입은 403 (리포트 구매 안내로 유도). Wave 2 에서 정책 확정.

---

## G6. POST /api/v1/orders/service (Wave 3)

시술 예약 보증금 결제. 구조는 G1·G2 와 동일하지만 `type: "service"`, `proposalId` + `depositAmount` + `visitDate`.

---

## G7. POST /api/v1/proposals/:id/reviews (Wave 3)

### Request

```json
{
  "rating": 5,
  "content": "만족스러운 시술이었습니다",
  "photos": ["https://..."],
  "visitDate": "2026-05-15"
}
```

리뷰는 시술 완료 (order.status === 'completed') 인 proposal 에 대해서만 작성 가능.

---

## 웹훅 엔드포인트 — PG 서버가 호출

### POST /webhook/payments/toss

- 토스페이먼츠가 비동기로 호출
- IP whitelist + signature 검증 필수
- 이벤트: `PAYMENT_STATUS_CHANGED`, `REFUND_COMPLETED` 등
- 서버가 해당 order.status 갱신

---

## 환불 흐름 (Wave 2 후반)

### POST /api/v1/orders/:id/refund

- 7일 이내 조건부 환불 (정책 확정 필요)
- 리포트 열람 여부·시술 예약 상태에 따라 환불률 차등
- PG 서버에 환불 요청 → 성공 시 order.status = refunded

---

## Mock → Real 전환 체크리스트 (Wave 2 집중)

- [ ] PG 선정 (토스페이먼츠 API key 발급)
- [ ] `apps/fo/src/lib/api/order/*` 신설 (types, requests, mapper, index)
- [ ] `POST /api/v1/orders/report` G1 real 구현
- [ ] `POST /api/v1/payments/confirm` G2 real 구현 + PG 서버 검증
- [ ] 웹훅 엔드포인트 구성 + signature 검증
- [ ] `GET /api/v1/orders`, `GET /api/v1/orders/:id` G3·G4
- [ ] `GET /api/v1/reports/:proposalId` G5 — 현재 FO 는 `MOCK_PROPOSALS` + generateFullReport 로 fallback 중
- [ ] FO 의 legacy `POST /api/payments` 제거 + SingleAnalysisPreview 의 fetch 경로 교체
- [ ] 영수증·환불 UI `/mypage/orders/*` 추가
- [ ] Legal: 전자상거래법·개인정보보호법·의료광고법 고지 추가

---

## yj.jung·CPO·Legal 확인 필요

1. **PG 선정**: 토스 vs Stripe vs 듀얼. 수수료·중국 지원·세금신고 비교 매트릭스
2. **리포트 정가**: 4,900원 고정 vs 병원 tier 별 차등 (CPO 결정)
3. **환불 정책**: 리포트 열람 전 100% 환불? 열람 후 X% 공제?
4. **영수증 발급**: 자동 발행 vs 요청 시 발행
5. **의료광고법**: 리포트 내용이 "의료행위 유인"으로 해석될 여지 검토 (Legal)
6. **세금**: 리포트 판매는 전자출판물로 분류? 컨설팅 서비스?

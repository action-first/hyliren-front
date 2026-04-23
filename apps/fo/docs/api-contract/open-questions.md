# Open Questions — yj.jung 과 합의해야 하는 항목

**목적**: 프로토타입에서 FO mock 으로 임의 결정한 부분 중 **real backend 구현 전에 반드시 백엔드와 합의** 해야 하는 것들. 이 문서를 그대로 리뷰 미팅 아젠다로 사용 가능.

---

## 1. 다국어 메시지 처리 전략

### 현재
FO mock 은 서버 응답의 `message` 를 **한국어로 고정**해서 내려보내고, FO 가 그대로 UI 에 표시 중.

### 선택지

**(a) 서버가 `Accept-Language` 헤더 보고 해당 언어로 반환**
- 장점: 클라이언트 로직 단순
- 단점: 서버에 번역 리소스 파일 유지. 번역팀 + 백엔드 동시 건드려야 함

**(b) 서버는 에러 `key` (`auth.error.invalidCredentials`) 만 반환, FO 가 `packages/i18n` 로 번역**
- 장점: 번역은 FO 전담. 서버는 logic 만.
- 단점: 클라이언트가 key → 문장 매핑 유지해야 함

### CTO 추천
**(b)**. 이유:
- FO 는 이미 `packages/i18n/messages/{ko,zh-CN}.json` i18n 파이프라인 있음
- 번역 업데이트 시 프론트 배포만으로 반영 — 민첩
- 과거 여러 서비스에서 (a) 선택 → 결국 프론트에서 overriding 하게 되는 걸 봄

### 결정 필요 시점
Wave 1 완료 전 (error message 형식이 API 계약 일부이므로).

---

## 2. 인증 토큰 저장 방식

### 현재
프로토타입: `localStorage` 에 accessToken·refreshToken 저장. XSS 공격에 취약.

### 선택지

**(a) 현 상태 유지 (localStorage)** — 프로토타입 허용
**(b) Access in-memory + Refresh httpOnly cookie** — 표준 권장
**(c) 전부 httpOnly cookie (CSRF 토큰 병행)** — 강화

### CTO 추천
**(b)**. Wave 2 초반에 전환. 전환 비용 4~6시간 (token-store.ts·client.ts·서버 쿠키 발급 로직).

### 결정 필요 시점
Wave 1 완료 ~ Wave 2 진입 사이. 아직 실유저 없어 마이그레이션 부담 없음.

---

## 3. Idempotency-Key 헤더 스펙

### 현재
프로토타입엔 idempotency 처리 없음. 사용자가 빠른 연속 클릭 시 중복 결제 가능.

### 합의 필요 사항

| 항목 | 제안 |
|---|---|
| 헤더 이름 | `Idempotency-Key` (Stripe 컨벤션) |
| 값 형식 | UUID v4 |
| TTL | 24시간 |
| 저장소 | Redis |
| 적용 범위 | `POST /orders/report`, `POST /orders/service`, `POST /payments/confirm` |
| 동일 키 재호출 정책 | 최초 응답 그대로 반환 (새 리소스 생성 안 함) |
| 다른 body 로 같은 키 사용 | 409 "Idempotency-Key mismatch" |

### 결정 필요 시점
Wave 2 (결제 연동 시) 전.

---

## 4. PG (결제 게이트웨이) 선정

### 선택지

| PG | 한국 | 중국 | 수수료 | 연동 난이도 |
|---|---|---|---|---|
| 토스페이먼츠 | ✅ 우수 | — | ~2.5% | 낮음 (한국어 문서) |
| Stripe | ⚠️ 해외 결제만 | ⚠️ | ~3% | 중간 (영문) |
| WeChat Pay | — | ✅ 우수 | ~1.6% | 높음 (중국 사업자 번호 필요) |
| Alipay | — | ✅ | ~1.2% | 높음 |
| iamport (KG이니시스) | ✅ | ⚠️ | ~3.5% | 낮음 |

### CTO 추천
**Wave 2: 토스페이먼츠 단일 채택.**
- 한국 사용자 (test 초기 유저층) 충분히 커버
- 중국 PG 는 사업자 등록·세금 이슈 복잡 → Series A 이후
- 토스 stablity·개발자 경험 우수

### 결정 필요 시점
**즉시.** 계약·테스트 계정 발급까지 1~2주 소요될 수 있음.

---

## 5. LLM Provider 선정 (concern-analysis)

### 선택지

| Provider | 모델 | 비용 (1M tokens) | 한국어 | 중국어 | vision |
|---|---|---|---|---|---|
| OpenAI | GPT-4o | $2.50 / $10 | 우수 | 우수 | ✅ |
| Anthropic | Claude 3.5 Sonnet | $3 / $15 | 우수 | 우수 | ✅ |
| 네이버 HyperCLOVA X | — | 별도 견적 | **최우수** | 양호 | 제한적 |
| 자체 파인튜닝 | Llama 3 등 | 인프라비 | 중간 | 중간 | 별도 |

### 결정 기준

- **정확도 > 비용** (의료 관련 조언이라 오답 리스크 큼)
- **한국어·중국어 동시 지원 필수**
- **vision**: photo 분석을 포함할지 — 포함 시 비용 ×3

### CTO 추천
**Wave 1: OpenAI GPT-4o or Anthropic Claude 3.5 Sonnet**. 성능 검증된 쪽. 파인튜닝은 데이터 쌓인 후 (Wave 3).

Photo 분석은 **선택적**으로 시작 — narrative 만으로도 초기 분석 충분. Photo vision 은 추후 옵션.

### 결정 필요 시점
Wave 1 킥오프.

---

## 6. 여권·의료 데이터 저장 정책

### 개인정보보호법·의료법 관점

- **여권 이미지**: 민감 개인정보. 암호화 저장 (SSE-KMS) + 접근 로그 필수
- **사진**: 얼굴·신체 — 민감 정보. 열람 권한 최소화 (BO 내 제한 role)
- **Narrative**: 건강 관련 언급 포함 가능. 의료법 관점 검토 필요

### 합의 필요

- 저장 기간 (legal 요구 vs 사용자 편의)
- 사용자 "내 데이터 삭제" 요청 시 응답 시간 (30일 이내)
- BO 내부자 조회 시 audit log

### CTO 요청
Legal 팀과 공동 결정. 프로토타입 단계에선 실제 사용자 데이터 받지 말 것 (seed 데이터만 운영).

---

## 7. BO·관리자 기능 설계

### 현재
BO 앱이 별도로 존재. 하지만 대부분 페이지 미구현·모킹 수준.

### 본개발 진입 시 BO 에 필요한 최소 기능

- 사용자 관리 (검색·계정 중지·권한 변경)
- 여권 승인 큐 (Wave 2 B5 와 연동)
- 병원 파트너 관리 (member-profile)
- 콘텐츠 CMS (article, Wave 3)
- 결제·환불 관리
- 이벤트·로그 조회
- 유저 데이터 삭제 요청 처리 (GDPR)

### 결정 필요
각 기능의 우선순위. BO 는 소수 내부 사용자이므로 **최소 기능만** + 이후 수요에 따라 확장.

---

## 8. 환경 분리·배포 전략

### 합의 필요

| 환경 | 도메인 | DB | 용도 |
|---|---|---|---|
| dev | dev.hyliren.com / dev-api.hyliren.com | dev DB | 개발자 통합 테스트 |
| staging | staging.hyliren.com / staging-api.hyliren.com | staging DB (주기 리셋) | 리허설·Legal 검토 |
| prod | hyliren.com / api.hyliren.com | prod DB | 운영 |

### CI/CD

- GitHub Actions → 자동 배포 (dev)
- staging·prod 는 manual gate (review 후 배포)
- DB 마이그레이션 전략 — Flyway / Prisma migrate

### 결정 필요 시점
Wave 1 중반.

---

## 9. 모니터링·장애 대응

### 합의 필요

- APM 툴: Datadog / New Relic / Sentry
- 로그 수집: CloudWatch / Grafana Loki
- 알림: Slack incoming webhook
- SLO: 초기 목표 — API p95 latency < 500ms, uptime > 99%

---

## 10. 데이터 정합성·트랜잭션

### 특히 주의할 케이스

#### (a) select-hospital + proposal.status 동기화
현재 설계: concern.status = closed 만 변경. proposal.status 는 그대로.
**논의**: proposal.status 를 'selected' 로 바꿔야 BO·분석 쿼리 단순. 아니면 JOIN 로 해결.

#### (b) Report 구매 ↔ Payment confirm
결제 성공 후 리포트 해금은 **하나의 트랜잭션**에서 처리 (order 상태 변경 + 구매 기록 생성).

#### (c) Concern submit ↔ 병원 notification
submit 시 해당 region·specialty 병원들에게 실시간 notification. 이때 병원 수가 많으면 background job 으로 빼야 함.

### CTO 제안
모든 쓰기 작업을 DB 트랜잭션으로 감싸고, 외부 호출 (PG·SMS·Push) 은 트랜잭션 commit 후 별도 queue 로 처리. 이중 기록·실패 방어.

---

## 리뷰 미팅 아젠다 템플릿 (yj.jung 공유용)

```
## 한옌리런 Customer API Contract 리뷰 — Wave 1 킥오프

### 1. 문서 리뷰
  - apps/fo/docs/api-contract/ 전체 훑어보기 (15분)

### 2. 즉시 결정 필요
  - [ ] #1 다국어 메시지 전략 (a/b 중 선택)
  - [ ] #4 PG 선정
  - [ ] #5 LLM provider 선정
  - [ ] #8 환경 분리 / 도메인 확정

### 3. Wave 1 할당
  - [ ] auth (A1~A5) 담당·기한
  - [ ] concern (D1~D5, D9) 담당·기한
  - [ ] proposal (E1, E3) 담당·기한
  - [ ] concern-analysis (C1) 담당·기한
  - [ ] event (I1) 담당·기한

### 4. 주간 싱크 일정
  - Wave 1 진행 중 매주 X요일 30분

### 5. 보류
  - Wave 2 항목들 (B1~B5, G1~G5) — Wave 1 완료 후 재킥오프
  - Wave 3 항목들 — Series A 이후
```

---

## 업데이트 규칙

- 결정이 내려지면 해당 항목에 ✅ 표시 + 결정 내용 + 결정 일자 기록
- 결정이 번복되면 이력 유지 (어떤 이유로 바뀌었는지)
- 새 open question 은 이 문서에 추가 (discussion-worthy 한 것만)

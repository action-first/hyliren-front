# FO ↔ Customer Backend API 계약 명세서

**작성일**: 2026-04-23
**작성자**: Sungho Choi (CTO 관점 정리)
**대상**: yj.jung (백엔드) — hyliren-api (customer 서버) 설계·구현
**목적**: 고객용 웹/앱(hyliren-front FO)에서 백엔드·DB 연동이 필수인 기능을 도메인 단위로 정리. RESTful 설계 기준 엔드포인트 명세.

---

## 이 문서의 성격

**일회성 요구사항서가 아님.** FO 프론트엔드가 **지금 실제로 호출하거나 의존하는 경계면**을 정본으로 고정하고, 본개발 진입 시 백엔드가 real 서비스로 치환할 수 있도록 지원하기 위한 **장기 참조 문서**입니다.

각 도메인 README 는 다음 4가지를 책임집니다:

1. **현재 FO 호출처** — 변경이 생기면 영향받는 파일·라인
2. **Wire shape** — 현재 mock 이 반환 중인 실제 JSON 구조 (정본)
3. **에러/엣지 케이스** — 4xx 응답의 `message` / `statusCode` 계약
4. **Mock → Real 전환 체크리스트** — 서버가 갖춰지면 FO 측 수정이 있을지 여부

---

## 도메인 인덱스 (시나리오 순서)

| # | 도메인 | 역할 | Wave |
|---|---|---|---|
| 0 | [공통 설계 원칙](api-contract-overview.md) | Envelope / Auth / Pagination / Error / Timezone / 보안 | — |
| 1 | [auth](auth/README.md) | 로그인·회원가입·토큰 갱신 | 🔴 W1 |
| 2 | [user](user/README.md) | 프로필·언어·여권 | 🟡 W2 |
| 3 | [concern-analysis](concern-analysis/README.md) | AI 고민 분석 (사진 + narrative → 증상/예산/옵션 추출) | 🔴 W1 |
| 4 | [concern](concern/README.md) | 고민 CRUD·상태 전이·사진 첨부·병원 선택 | 🔴 W1 |
| 5 | [proposal](proposal/README.md) | 병원이 보낸 제안서 조회·읽음 처리 | 🔴 W1 |
| 6 | [member-profile](member-profile/README.md) | 병원 상세 프로필 | 🟡 W2 |
| 7 | [order-payment](order-payment/README.md) | 리포트·시술 주문·결제·후기 | 🟡 W2 |
| 8 | [article](article/README.md) | 교육 콘텐츠 | 🔵 W3 |
| 9 | [event](event/README.md) | 이벤트 트래킹 | 🔴 W1 |
| 10 | [search](search/README.md) | 검색·자동완성·추천 | 🔵 W3 |

**보조 문서**:
- [priority-roadmap.md](priority-roadmap.md) — Wave 1/2/3 진입 순서, mock 제거 타이밍
- [open-questions.md](open-questions.md) — yj.jung 과 합의 필요한 결정 사항
- [db-schema-alignment.md](db-schema-alignment.md) — **DB 정본(`docs/schema/final.sql`) vs FO 타입·상수 대조 감사**. Wave 1 전 필독.

---

## Wave 정의

| Wave | 시점 | 기준 |
|------|------|------|
| **🔴 Wave 1** | 시연 직후, 본개발 진입 즉시 | 현재 FO 가 실사용 중인 엔드포인트. 미구현 시 유저 가입·고민 등록·제안서 수신 자체가 깨짐 |
| **🟡 Wave 2** | 첫 실사용자 온보딩 전 | 사진 업로드·결제·프로필 편집. 수익화와 실서비스 가동의 전제 |
| **🔵 Wave 3** | Series A 이후 | 검색 CMS, 소셜 로그인, 신고 기능 등. 성장·방어 계층 |

---

## 용어

| 용어 | 의미 |
|---|---|
| **FO** | hyliren-front (고객용 Next.js 앱, 현재 port 9000) |
| **PO** | partner 앱 (병원 대시보드, port 9001) |
| **BO** | back-office (관리자, port 9002) |
| **customer backend** | yj.jung 가 개발 중인 `hyliren-api` 의 고객 대면 API |
| **wire shape** | 네트워크를 흐르는 JSON 구조. FO 의 `packages/shared/src/types/*` 타입이 기준 |
| **mapper** | wire → domain 변환 레이어 (`apps/fo/src/lib/api/*/mapper.ts`). 서버가 shape 을 바꿔도 FO 는 mapper 만 수정하면 끝 |
| **envelope** | 모든 응답이 공유하는 바깥 구조 `{ success, data, statusCode?, message?, error? }` |

---

## 읽는 순서 권장

1. **먼저 읽기**: [api-contract-overview.md](api-contract-overview.md) — 모든 도메인의 공통 규약
2. **시나리오 따라가기**: auth → concern-analysis → concern → proposal → order-payment 순
3. **실행 계획**: [priority-roadmap.md](priority-roadmap.md) 로 언제 뭘 할지
4. **리뷰 미팅 전**: [open-questions.md](open-questions.md) 로 합의 항목만 빠르게 체크

---

## 업데이트 규칙

- **계약이 변경될 때**: 해당 도메인 README 가 우선. 루트 README 목차는 자동 반영 안 됨 — 필요 시 직접 편집
- **새 도메인이 추가될 때**: 루트 README 의 도메인 인덱스 표 + 폴더 추가 + Wave 지정
- **Mock 이 제거될 때**: 해당 도메인 README 의 "Mock → Real 전환 체크리스트" 에 완료 표시

---

## 현재 스냅샷 (2026-04-23 기준)

| 항목 | 상태 |
|---|---|
| yj.jung 구현 완료 | `/auth/*` 클라이언트 계약 + `lib/api/client.ts` refresh 로직 |
| FO mock 제공 중 | `/api/v1/concerns/*`, `/api/concern-analysis`, `/api/payments`, `/api/events`, `/api/proposals` (PATCH only) |
| FO 직접 호출처 | `apps/fo/src/lib/api/**` + 일부 컴포넌트 직접 fetch (본개발 전환 시 정리 대상) |
| 남은 legacy | `/api/proposals` (PATCH viewedAt), PO/BO 의 `/api/*` 전체 |
